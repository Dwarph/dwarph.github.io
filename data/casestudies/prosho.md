![alt text](./images/casestudies/prosho.png)

## My Role

Senior XR Engineer, leading design & interaction research on the project.

---

## About the project
Hyperion is Ultraleap's sixth generation of hand tracking. Its focus was on providing developers with different hand tracking models, each targeted at excelling in specific use cases.

Ultraleap needed a way to demonstrate the power of the new tracking models, and understand how to best design for any new contexts these hand tracking models afforded. Based off of needs identified through stakeholder interviews, we built three different applications, each targeted at a model's specific use case.

---

## The Challenge

Product provided us with a simple challenge: **create a way to enable BD to show off Hyperion's different models in conferences and sales scenarios**.

After interviewing key stakeholders and more deeply understanding the requirements around Hyperion, I then split this into three distinct challenges:

**1. Create an XR application which detects, and shows off microgestures, using the microgesture model, through UI interactions that could be broadly applicable elsewhere**

After some promising research & good customer reactions, microgestures were one of our key interactions we need to hit - building an application which showed off how well we could track them, and that shows how they could be applied to control UI.

**2. Create an application which shows off fiducial marker tracking combined with a hand on object model in a procedural training scenario**

A number of enterprise focused customers were interested in using our hand on object model to track hands whilst holding objects, butdidn't find it wasn't helpful if you couldn't also track the object you were holding. We needed to make an application which showed off both of these features.

**3. Allow for easy navigation between both apps**

We wanted users to be able to navigate between these apps in a seamless manner, without exiting the Ultraleap brand experience.

---

## The Solution

### Understand & identify the problem

*user research / user needs identification*

![alt text](./data/casestudies/images/prosho/interviews.png)
*Internal research & interview results*

The initial project brief we were provided from Product was too vague to dive straight into designing or building something - we needed to understand the business and user needs first. In order to do so, I:

- Researched and read through all internal documentation from the past year around custom Hyperion models
- Interviewed product owners to understand their requirements for the app, and understand the purpose of each custom model more deeply
- Organised an ideation workshop where we ideated based on the initial identified requirements
- Produced 2d storyboards based on the outcomes
- Produced spatial prototypes in ShapesXR based on those storyboards
- Identified key BD stakeholders & discussed the prototypes with them
- Based on the findings from those interviews, reached a final decision and presented the results back to the team

![alt text](./data/casestudies/images/prosho/storyboard.png)
*A rough storyboard based on initial ideation*

<p align="center">
<iframe width="315" height="315" src="https://www.youtube.com/embed/Rk_nrqGt_To" title="Hyperion showcase - shapesXR - early storyboard" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</p>
*A ShapesXR prototype based on the storyboard*

### Microgestures

*interaction research / ux design / user testing / design sprints / figma*

Microgestures was a project we kicked off in 2023, based on some promising prototype Rory Clark & I had built. I'd run two intense design sprints, and a couple interaction research focused sprints in the weeks leading up to CES in order to build a MVP demo for it, but now needed to professionalise our findings, and improve the interaction reliability. 


I ran an ideas jam with our interaction team, finding interesting use cases based on the requirements previously identified. We took these ideas, and Taru Muhonen, Senior UX Designer, sketched up some UIs for Matt Filer, Senior XR Engineer, to prototype whilst I was away at MIT Reality hack.

![alt text](./data/casestudies/images/prosho/utr.png)
*User testing results*

Once I returned, we began to iteratively prototype & build the app for another 6 weeks - aiming to up percieved reliability of microgestures. I ran regular user tests to test whether we had successfully managed to do so. One of the **major** challenges with this project was that the microgestures model was still in beta, and had no work planned on improving it in the near future - so we had to lean heavily on our heuristic & UX design to improve reliability.

![alt text](./data/casestudies/images/prosho/mgfigma.png)
*Figma design mockups*

Throughout the project, I split my time between designing UI for Matt to implement, or performing interaction research on how to both best detect & design for microgestures.

Watch a full playthrough of the app, below:

<iframe width="100%" height="316px" src="https://www.youtube.com/embed/qjTN1CX2ClM?si=l0STduPyA_jnLKBD" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

### Hand On Object + Fiducial Marker Tracking

*interaction research / ux design / user testing / design sprints / project leadership*

I kicked this project off with a design sprint focused on building marketing content in time for the Hyperion Launch. We built four different prototypes, each showing off a different use case of which we used as a basis for the apps we would build going ahead. We had 6 weeks to build these apps - ensuring they were ready in time for AWE.

![alt text](./data/casestudies/images/prosho/designdoc.png)
*A section of the design doc I produced*

I worked with key stakeholders to understand the customers we wanted to target, and produced a design document for each application we initially had planned on prototyping.

The hand on object demo had been delayed as we waited for fiducial marker tracking improvements to be implemented, but unfortunately the work hadn't been done by the time we started prototyping, meaning that project progress was slow. In order to get things moving more quickly, I began to cross-coordinate teams, relaying priorities between multiple teams.

![alt text](./data/casestudies/images/prosho/markervalidation.png)
*An excerpt from a research writeup around marker performance validation*

As well as this I undertook interaction research for the markers, to validate which marker types/size/material tracked best, and how we could best design for using them alongside hand tracking.

<p align="center">
<iframe width="315" height="315" src="https://www.youtube.com/embed/GllULLaXz_M?si=k02vIEyrvhnBpgEB" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</p>
*ShapesXR prototype for an unbuilt marker/hand on object demo*

As well as this, we were working with a team in America to build one of the demos, which I designed for them, prototyping out ideas in ShapesXR.

We quickly iterated on the concepts we'd built for each use case, in order to reach a decision point, where we decided to merge them all into one demo - a procedural-training-lite demo rooted in a coffee barista context.

As the deadline was tight, I was unable to run a formal user test, and instead ran a formal test on colleagues unfamiliar with the technology.

### XR Launcher Updates

*ui design / figma*

![alt text](./data/casestudies/images/prosho/folders.png)
*As part of the launcher updates, I designed a folder system, to neatly group together related apps*

Our early prototypes had all had a UI from which a user could launch into a different Hyperion experience. Instead of building this, we decided to reskin our existing XR Launcher, working with marketing based on the latest brand guidelines. I used figma to design this, before implementing it in Unity.

---

## Impact

With these apps, we managed to excite customers at AWE, who wanted to immediately start developing with Hyperion. Microgestures helped sell Hyperion to new OEMs, who specifically met with us based on the microgestures demo.
