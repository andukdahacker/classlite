# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: Reset password
      - generic [ref=e7]: Enter your email to receive a password reset link
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]: Email
        - textbox "Email" [ref=e12]:
          - /placeholder: name@example.com
      - button "Send reset link" [ref=e13]
      - link "Back to sign in" [ref=e15] [cursor=pointer]:
        - /url: /sign-in
  - region "Notifications alt+T"
```