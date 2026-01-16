```bash
git checkout -b branch1
echo "Conflict from branch1" > conflict.txt
git add conflict.txt
git commit -m "Branch1 change"

git checkout main
git checkout -b branch2
echo "Conflict from branch2" > conflict.txt
git add conflict.txt
git commit -m "Branch2 change"

git checkout main
git merge branch1
git merge branch2

git add conflict.txt
git commit -m "Resolved merge conflict"
