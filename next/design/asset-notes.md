# Asset notes

The chest image in `public/images/chest-illustration.webp` is a synthetic image generated using the built-in image tool. Prompt: a realistic grayscale educational frontal chest radiograph with no pathology claim, identifiers, text or annotations. It is not a patient scan, dataset sample or model result.

Four standalone section references were generated before implementation: hero, workbench, methodology and closing. The hero reference was subsequently approved by the user as the visual target. The user specifically requested improving the lung anatomy to match it.

`public/images/lungs-particles.webp` is a transparent synthetic illustration generated with the built-in image tool, derived from the approved hero reference. Prompt: isolate the complete anatomically recognizable particle lungs and trachea, ivory particle surface, branching copper-orange bronchi, no typography, background or orbit lines. The current UI displays this image directly with a small pointer-hover CSS tilt. There is no idle animation, dragging, scroll effect or WebGL renderer. It is a concept illustration, not a patient reconstruction.

`public/images/example-chest.jpg` is a format-converted JPEG of the same synthetic chest illustration, supplied only as a labelled interface/inference example. It is not an NIH dataset record or a real patient scan.
