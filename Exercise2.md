```bash
git branch feature
git checkout feature

echo "Feature development" > feature.txt
git add feature.txt
git commit -m "Added feature file"

git checkout main
git merge feature
git branch -d feature
```
