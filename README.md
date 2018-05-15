# inst-kun
inst kun

```bash
# local development
cd functions/
yarn run tsc --watch
firebase serve --only functions

# deploy
cd functions
yarn build
cd ../
firebase deploy --only hosting,functions
```