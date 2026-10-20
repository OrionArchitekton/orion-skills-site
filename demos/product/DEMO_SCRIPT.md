# orion-skills product demo

Recorded local output from v0.6.0. Synthetic data, edited replay; no external provider calls.

### SHOT select
- target: terminal
- url: index.html?scene=select
- narration: Orion Skills is a library of workflow instructions for coding agents. Here I select prove deploy is live from the public release and inspect its three proof requirements before copying it.
- action: goto url="index.html?scene=select"
- action: wait ms=400

### SHOT copy
- target: terminal
- url: index.html?scene=copy
- narration: The copied skill file has the same hash as the source. This is an isolated demonstration directory, not an installation into my running agent. Review a skill before using it in your own setup.
- action: goto url="index.html?scene=copy"
- action: wait ms=400

### SHOT preserve
- target: terminal
- url: index.html?scene=preserve
- narration: When the destination already exists, preserve it and inspect it deliberately. The skills describe habits, not new execution authority. The site distinguishes the full library from its verified starter set. Follow those documented support boundaries.
- action: goto url="index.html?scene=preserve"
- action: wait ms=400
