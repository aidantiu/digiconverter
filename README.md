# CI/CD Pipeline

This project uses **GitHub Actions** to run a simple CI/CD pipeline.  

## What it does
1. Runs when code is pushed or a pull request is made to the `main` branch.  
2. Installs project dependencies from the `server/` folder.  
3. Builds the project (if a build script exists).  
4. Runs tests (skips without failing if none exist).  
5. Performs a mock deployment by printing **"Deploying..."**.  

## File Location
The workflow file is in:  
.github/workflows/ci-cd.yml

ANSWER FOR THE QUESTION 2.
2. What does the following command do? (5 pts)
chmod +x script.sh

- The command `chmod +x script.sh` makes the file `script.sh` executable so it can be run directly with `./script.sh`.

