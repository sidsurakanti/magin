# Overview
Generate short 3Blue1Brown style animations to visualize tricky math/cs concepts (matrix multiplication, gradient descent, derivatives, partial derivatives, CUDA GPU warps, etc.) leveraging LLMs and Manim CE.

![demo](https://github.com/user-attachments/assets/1e652667-cbe0-4663-9e05-fea0a5d1b1bb)

https://github.com/user-attachments/assets/8bd68380-1258-498a-8651-77c21cf50727


## Target Audience
- Teachers & Educators (like my dad) who want clear, visual tools to explain tough concepts.
- Students who struggle with abstract ideas in calculus, linear algebra, and other math-heavy courses.
- Developers trying to wrap their heads around GPU concepts like warping and memory coalescing.

> *(fun bit: i actually used this a couple times while making this to help my friends out with homework, and it worked lmao)*

## Use Cases
Anything related to Math and CS!
> See the demos section for more concrete examples of how this project can be applied.

## Prerequisities 
- Python 3.12+
- Anthropic API KEY
- Docker

## Usage
```bash
git clone https://github.com/sidsurakanti/repo.git && cd repo
```
```bash
# rename .env.example to .env and replace ANTHROPIC_API_KEY
ANTHROPIC_API_KEY=""
```
```bash
# for frontend
cd frontend && npm run dev 
```
```bash
# for backend
cd backend && docker compose up
```

Visit `http://localhost:3000` to access the app and test it out!

## Tech Stack
![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009485.svg?style=for-the-badge&logo=fastapi&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)


## Pipeline
```md
base user prompt {
    -> scriptgen (essentially a step-by-step walkthrough for the animation)
    -> codegen (the manim code for the animation)
} est ~30-60s depending on prompt size {
    -> errorgen (on render error, happened maybe once out of my 300 test iterations)
    -> RENDER COMPLETE 
} est ~30-45s, 720p30 {
    -> editgen (for user iteration, since we cannot rely on llm to one-shot a good animation 100% of the time from a simple prompt)
} est < 30s
```

## Acknowledgements
This project was very much inspired by 3Blue1Brown and wouldn't be possible without him and his work (if you couldn't tell already). Shoutout to HackGT as well.
