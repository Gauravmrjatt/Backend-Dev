```bash
git init

touch app.js config.json notes.txt
git add .
git commit -m "Added project files"

echo "node_modules/" > .gitignore
git add .gitignore
git commit -m "Added gitignore"

git stash
git stash pop

git tag -a v1.0 -m "First release"

git remote add origin https://github.com/your-username/repository-name.git
git push origin main
git push origin --tags
```
