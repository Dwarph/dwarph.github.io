[![Sidestep, Jump & Crouch - in-game header](./data/casestudies/images/sidestep-jump-crouch/header.png "bleed-xl")](./data/casestudies/images/sidestep-jump-crouch/header.png)

## Overview

FitXR hadn’t shipped a new move for Box + Combat in ~2 years. i joined + designed, prototyped + shipped **3 new VR moves (sidestep, jump + crouch)** in **3 months**, as my first project at FitXR.

<div class="cs-overview">
  <table class="cs-overview-table">
    <tbody>
      <tr>
        <th scope="row">Role</th>
        <td>Senior Product Designer. led end-to-end design + prototyping in Unity, ran the iteration loop, aligned stakeholders weekly, drove polish to ship, and monitored user feedback post-launch.</td>
      </tr>
      <tr>
        <th scope="row">Constraints</th>
        <td>Mass-market VR. different bodies, different rooms, safety constraints. “feels good” matters as much as “looks cool”.</td>
      </tr>
      <tr>
        <th scope="row">Output</th>
        <td>50+ prototypes → 3 shipped moves with a shared visual language + interaction rules.</td>
      </tr>
      <tr>
        <th scope="row">Impact</th>
        <td>Shipped into the most-played modes. strong, purely positive player sentiment (e.g. <em>“Finally, my pulse is racing. Love it.”</em>). no classes now ship without using these moves. Design of these moves is now being ported over and reused in other studios too.</td>
      </tr>
    </tbody>
  </table>
</div>

### About the project

FitXR is a VR fitness app played by tens of thousands of people. Box and Combat are the most-played modes, but FitXR hadn't shipped a new move for them in 2 years. The team had attempted to ship some earlier in the year and the project had stalled.

i joined and was asked to design, prototype + ship 3 new moves - Sidestep, Jump and Crouch - in 3 months - so that they were ready for release in our peak season (January).

---

## The Challenge

Find moves that feel big, intuitive + fun in VR, and ship them fast.

VR is one of the most human technologies out there. You can't design spatial things in Figma; you have to feel them. Full-body workouts mean designs need to work for many different bodies, in many different rooms, at very different fitness levels.

To accomplish this, we made over 50 prototypes in 3 months.

[![A sample of early Unity prototypes](./data/casestudies/images/sidestep-jump-crouch/prototype-examples.png "wide")](./data/casestudies/images/sidestep-jump-crouch/prototype-examples.png)

---

## The Solution

i landed on a loop i called **Design, Discard, Deliver** - with a relentless feedback loop running through all of it.

[![Design, Discard, Deliver loop diagram](./data/casestudies/images/sidestep-jump-crouch/design-discard-deliver.png "wide")](./data/casestudies/images/sidestep-jump-crouch/design-discard-deliver.png)

- **Design** - get into VR fast. prototype in Unity, feel it.
- **Discard** - if it's not working, throw it away. don't get attached.
- **Deliver** - once you find the magic, stop iterating + start polishing.

The feedback loop was constant Slack updates, weekly product reviews with stakeholders, weekly internal playtests, and a couple of rounds of external playtests once prototypes were testable.

### Jump - the quick win

<figure class="cs-media cs-media--bleed">
  <video autoplay loop muted playsinline preload="metadata" src="./data/casestudies/images/sidestep-jump-crouch/jump.mp4"></video>
</figure>

9 prototypes. The cleanest run of the framework we did.

The challenge with Jump was making it feel really vertical without people cracking their head on the ceiling or having their headset fall off mid-jump. Early prototypes used horizontal motion - a Wipeout-style obstacle sliding toward you. It didn't read as "jump".

The unlock was vertical motion. A bottom bar + top bar with high contrast, and an interesting pattern between them. Even though the motion is only ~10cm, the upward pulse hints at what your body should do. We made the jump itself flexible - heel raise to full tuck - so it suits a lot of different body types.

A burst that feels big but stays safe. No big hiccups.

[![A snapshot of the jump prototype set](./data/casestudies/images/sidestep-jump-crouch/jump-prototypes.png "wide")](./data/casestudies/images/sidestep-jump-crouch/jump-prototypes.png)

### Sidestep - rummaging through the trash

<figure class="cs-media cs-media--bleed">
  <video autoplay loop muted playsinline preload="metadata" src="./data/casestudies/images/sidestep-jump-crouch/sidestep.mp4"></video>
</figure>

12 prototypes. The lesson here was about not being afraid to look at your discard pile.

Sidestep had the same problem as Jump - small motion, big feel - but the kicker was that players were instinctively dodging with their head, like they would in Beat Saber. We wanted them to feel like a kick-ass ninja, not a Beat Saber player.

We tried solving it with affordances. Bigger arrows, thicker targets, longer walls. None of it worked. So we discarded.

Then i went back through old prototypes and found prototype 6, one we'd moved past too early. Two things were quietly working in it: feet symbols on the floor + a lane visual that slid out from under them.

The feet idea actually came from an old Ultraleap project on touchless touchscreens during COVID. Research showed 99.9% of people will stand exactly where you put a pair of feet on the floor. It worked here too - the feet told players to move their whole body, not just their head. The lane visual signalled that their entire point of reference was shifting.

We also locked in the visual language here - blue bar on the left, white fade in the middle, glow on the outside. It became the lynchpin for the next move.

[![A snapshot of the sidestep prototype set](./data/casestudies/images/sidestep-jump-crouch/sidestep-prototypes.png "wide")](./data/casestudies/images/sidestep-jump-crouch/sidestep-prototypes.png)

### Crouch - the beast

<figure class="cs-media cs-media--bleed">
  <video autoplay loop muted playsinline preload="metadata" src="./data/casestudies/images/sidestep-jump-crouch/Crouch.mp4"></video>
</figure>

15+ prototypes. Took us all 3 months and then some.

Crouch had to force you to drop low + dodge sideways. Long moments of tension, fast transitions. Around prototype 11 we had something that looked cool - similar art style, pulse of energy in front of you - but stakeholders + external testers all said the same thing: over-complicated, confusing, claustrophobic.

So we discarded again. And we breathed - we paused on Crouch, focused on polishing Jump + Sidestep, and let the problem chug along in the background.

When we came back, the answer was already in the work we'd done. Jump + Sidestep were flat, simple, motion-led. What if we applied the same restraint to Crouch?

It worked. You can chain Crouches together to make weaves. The bars become the transition. There's an almost-Matrix moment where you move past them. The simpler we made it, the better it got.

[![A snapshot of the crouch prototype set](./data/casestudies/images/sidestep-jump-crouch/crouch-prototypes.png "wide")](./data/casestudies/images/sidestep-jump-crouch/crouch-prototypes.png)

---

## Impact

Sidestep, Jump and Crouch shipped together into FitXR's Box and Combat workouts. Player response was strongly positive - one of my favourites was: *"Finally, my pulse is racing. Love it."*

[![A snapshot of player feedback post-launch](./data/casestudies/images/sidestep-jump-crouch/user-feedback.png "bleed-xl")](./data/casestudies/images/sidestep-jump-crouch/user-feedback.png)

Three things i took away:

- **Your first idea isn't your best. Neither is your 11th.** Get in, test fast, run the loop. The more context you carry in your head, the sooner the magic shows up.
- **Use your stakeholders.** Cultivate an environment where they can tell you something's bad without it being personal. They'll see the wood for the trees when you can't.
- **Delivery is where you breathe.** Polishing the things that are working buys space for the harder problems to solve themselves.

i gave a talk on this at XRCC Online and as a guest lecture at Glasgow University. [Watch it on YouTube.](https://youtu.be/i6fCFnmGtv8?si=zC30whvvtP7HhUxU)