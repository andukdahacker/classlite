import { FastifyBaseLogger } from "fastify";
import * as fs from "fs/promises";
import * as handlebars from "handlebars";
import * as path from "path";
import { Resend } from "resend";
import Env from "../env.js";

interface EmailServiceConstructor {
  apiKey: string;
  templatesDir: string;
  logger: FastifyBaseLogger;
  nodeEnv: Env["NODE_ENV"];
}

interface SendEmailProps {
  to: string;
  subject: string;
  template: string;
  data: any;
}

class EmailService {
  private resend: Resend;
  private templatesDir: string;
  private logger: FastifyBaseLogger;
  private nodeEnv: Env["NODE_ENV"];

  constructor({
    apiKey,
    templatesDir,
    logger,
    nodeEnv,
  }: EmailServiceConstructor) {
    this.resend = new Resend(apiKey);
    this.templatesDir = templatesDir;
    this.logger = logger;
    this.nodeEnv = nodeEnv;
  }

  async send({ to, subject, template, data }: SendEmailProps) {
    if (this.nodeEnv === "development") {
      this.logger.info("Email sending skipped in development environment.", {
        to,
        subject,
        template,
      });
      return;
    }

    try {
      const templatePath = path.join(this.templatesDir, `${template}.hbs`);
      const templateContent = await fs.readFile(templatePath, "utf-8");
      const compiledTemplate = handlebars.compile(templateContent);
      const html = compiledTemplate(data);

      const { data: emailData, error } = await this.resend.emails.send({
        from: "ClassLite <no-reply@classlite.app>",
        to,
        subject,
        html,
      });

      if (error) {
        throw error;
      }

      return emailData;
    } catch (error) {
      this.logger.error("Error sending email:", error);
      throw error;
    }
  }
}

export default EmailService;
