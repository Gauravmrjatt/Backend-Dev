```bash
mkdir git-practice
cd git-practice
git init

echo "# Git Practice Repository" > README.md
git add README.md
git commit -m "Initial commit"

echo "Learning Git workflows" >> README.md
git add README.md
git commit -m "Updated README"

git log --oneline
```
