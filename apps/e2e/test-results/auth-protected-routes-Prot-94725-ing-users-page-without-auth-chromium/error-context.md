# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: Sign in
      - generic [ref=e7]: Choose your preferred sign in method
    - generic [ref=e8]:
      - button "Sign in with Google" [ref=e9]:
        - img
        - text: Sign in with Google
      - generic [ref=e13]: Or continue with email
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Email
          - textbox "Email" [ref=e17]:
            - /placeholder: name@example.com
        - generic [ref=e18]:
          - generic [ref=e19]: Password
          - textbox "Password" [ref=e20]:
            - /placeholder: ••••••••
        - generic [ref=e21]:
          - generic [ref=e22]:
            - checkbox "Remember me" [ref=e23]
            - checkbox
            - generic [ref=e24] [cursor=pointer]: Remember me
          - link "Forgot password?" [ref=e25] [cursor=pointer]:
            - /url: /forgot-password
        - button "Sign In" [ref=e26]
        - paragraph [ref=e27]: For Teachers, Students, and Center Staff
      - generic [ref=e28]:
        - text: Don't have a center yet?
        - link "Register Center" [ref=e29] [cursor=pointer]:
          - /url: /sign-up/center
  - region "Notifications alt+T"
```