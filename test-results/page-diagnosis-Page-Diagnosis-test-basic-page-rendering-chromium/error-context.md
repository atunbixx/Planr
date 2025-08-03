# Page snapshot

```yaml
- main
- alert
- main:
  - heading "Wedding Planner" [level=2]
  - paragraph: Sign in to continue planning your perfect day
  - text: Email address
  - textbox "Email address": hello@atunbi.net
  - text: Password
  - textbox "Password": Teniola=1
  - button "Sign in"
  - paragraph:
    - text: Having trouble?
    - link "Try quick sign-in":
      - /url: /quick-signin
```