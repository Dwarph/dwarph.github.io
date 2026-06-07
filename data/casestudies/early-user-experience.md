[![The kickstart plan: an onboarding path for new users](./data/casestudies/images/eux/popv2_plan.png "bleed-xl")](./data/casestudies/images/eux/popv2_plan.png)

## Overview

Over six months I designed, tested, and iterated a guided first-week experience for new subscribers: a starting point in a library of 1,000+ workouts instead of drowning in choice. While that shipped, I overhauled the paywall in a two-week sprint, borrowing patterns from subscription apps that convert.

For the paywall, we needed patterns that work and a clear value proposition. For onboarding, we needed to prove a guided path worked, then build it properly.

This case study focuses on both projects through the lense of user centred design as a way to move metrics.

<div class="cs-overview">
  <table class="cs-overview-table">
    <tbody>
      <tr>
        <th scope="row">Role</th>
        <td>Senior Product Designer. Led end-to-end design: research, design, user testing, stakeholder alignment.</td>
      </tr>
      <tr>
        <th scope="row">Constraints</th>
        <td>We wanted to adopt a mining for gold approach. Trying small experiments until we found signal - and then doubling down.</td>
      </tr>
      <tr>
        <th scope="row">Output</th>
        <td>A guided onboarding journey for new users' first week inside the app. A complete paywall overhaul.</td>
      </tr>
      <tr>
        <th scope="row">Impact</th>
        <td>+16% new user conversion. +10% subscription conversion. +30% users completing at least one workout.</td>
      </tr>
    </tbody>
  </table>
</div>

---

## Paths of Play

Paths of Play was our name for our solution to our onboarding problem: a guided, first-week onboarding. Made up of a sequenced set of workouts and UI changes, it replaces "here's everything, good luck" with "start here, then here."

Before launching into the project, I user tested our existing onboarding to gain conviction and signal.

[![User testing outcomes](./data/casestudies/images/eux/popv1_usertesting.png "bleed-xl")](./data/casestudies/images/eux/popv1_usertesting.png)

### V1: Mine for Gold (March 2025)

We wanted to move quick with V1, and test three tenets we'd defined.

- **Personalisation:** a calibration step, tailored first workout, and a personalised plan based on their goals.
- **Simplification:** after subscribe, straight into a workout. Post-workout summaries stripped back; rewards, detailed previews, and room-blend features stayed locked until you were a more qualified player.
- **Everyone's a winner:** achievable early goals and simplified classes so people got a win before we asked for more commitment.

[![Calibration step: build ownership of your plan](./data/casestudies/images/eux/popv1_calibration.png "wide")](./data/casestudies/images/eux/popv1_calibration.png)

<figure class="cs-media cs-media--wide">
  <video loop muted playsinline preload="none" src="./data/casestudies/images/eux/popv1_PickingWorkout.mp4"></video>
  <figcaption>Motion design to build trust and excitement about your first class</figcaption>
</figure>

**+9% trial-to-member conversion.** Strongest result this team had seen in this space for a long time.

**+17% playing multiple workouts on day one.** Far more new users built momentum on their first day instead of stopping after one.

First-day engagement didn't yet lift next-day return. We rolled V1 to all English-speaking users within two weeks.

### V2: Doubling Down (June–August 2025)

V1 proved the guided path worked. The weak spot was return. Not enough reason to come back the next day. The plan blended into the rest of the app; users couldn't see what to focus on or what came next.

V2 doubled down on the signal. We built a kickstart plan that was impossible to miss. You always knew what to do next.

[![Kickstart plan ready: leaning hard into plan imagery](./data/casestudies/images/eux/popv2_Kickstart%20Plan%20Ready.png "wide")](./data/casestudies/images/eux/popv2_Kickstart%20Plan%20Ready.png)

We day-gated every two days, a hook to come back, not just pacing for its own sake. We locked down more of the product so users stayed tunnel-visioned on the kickstart until they graduated. Unlock moments were designed to feel special: milestones, not permissions. Finish the plan and a celebration animation showed all your workouts merging into one collection.


<figure class="cs-media cs-media--wide">
  <video loop muted playsinline preload="none" src="./data/casestudies/images/eux/popv2_kickstart_plan.mp4"></video>
  <figcaption>Completing the kickstart plan: workouts merge into one collection.</figcaption>
</figure>

Before the A/B test, Zoe and I user tested the designs. People understood the locked model immediately. They missed one unlock beat, not realising they could browse outside the plan once it opened up, and we fixed that before ship.

**+4% active on three or more days.** The kickstart plan gave people a reason to return across the first week, not just a strong first day.


### V2.5: Optimise (August–October 2025)

V2 had raised the floor for our onboarding - but now we needed to optimise.

Users were loud about one thing: day gating was frustrating. Our user-test participants hadn't flagged it, but reviews gave us a clear signal it wasn't worth the trade-off. We scrapped it.

We doubled down on everyone's a winner and updated the copy to match. No more tutorial language. Wording that put people in the action already. Class 1 went from "Box Foundations" to "Make Your Move."

We upgraded the rewards. Not just more workouts. Our best environments and gloves, the kind of thing that reflects what FitXR is actually worth playing for.

A stamp system made the path legible: what to do today, what unlocks when you come back. Not just a plan floating in the UI.

[![Stamp system: daily progress and unlocks at a glance](./data/casestudies/images/eux/popv25_stamps.png "wide")](./data/casestudies/images/eux/popv25_stamps.png)

We shortened the plan. Users shouldn't feel stuck in beginner mode longer than they need to.

**+29% plan completion.** Less friction, shorter path. More people finished instead of dropping off mid-journey.

**+6% trial-to-member conversion.** Removing day gating didn't hurt commitment; optimising the experience helped.

People finished in hours, not the days we'd planned for. Users were moving faster than we'd assumed, and the shorter plan gave them room to do that.

---

## The Paywall

Midway through Paths of Play I got pulled onto a two-week sidequest: redesign the paywall.

The old screen buried value in full-width copy and dense pricing cards, hard to read on a VR display. I looked at subscription apps outside VR that convert, then split the layout for skimming: goal-matched value on the left, a stripped-back decision on the right. Weekly price, softer trial language, clearer hierarchy.

[![Paywall moodboard: competitor patterns outside VR](./data/casestudies/images/eux/Paywall%20moodboard.png "bleed-xl")](./data/casestudies/images/eux/Paywall%20moodboard.png)

<div class="cs-media-row">
  <figure class="cs-media">
    <a href="./data/casestudies/images/eux/Paywall_Before.png"><img src="./data/casestudies/images/eux/Paywall_Before.png" alt=""></a>
    <figcaption>Before: poor readability, weak value prop</figcaption>
  </figure>
  <figure class="cs-media">
    <a href="./data/casestudies/images/eux/Paywall_After.png"><img src="./data/casestudies/images/eux/Paywall_After.png" alt=""></a>
    <figcaption>After: value on the left, decision on the right</figcaption>
  </figure>
</div>

**+10% paywall conversion.** The paywall had been hard to move for years; we moved it by focusing on user needs.

---

## Impact and Learnings

**+30% users completing at least one workout.**
**+16% new user conversion.**
**+10% paywall conversion.**

- **Follow signal, not the roadmap.** We started small, doubled down when V1 proved the guided path worked, then optimised when users outpaced the design in V2. Small bets until you have signal, then push hard.
- **Cut what you built when live evidence says so.** Day gating felt considered from our side. Users found it controlling. User testing hadn't flagged it, but live users did.
- **Fix what users were stuck on.** Each improvement focused on concrete user problems, not a funnel tweak in isolation.
