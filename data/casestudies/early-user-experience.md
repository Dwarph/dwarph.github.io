[![Kickstart plan in VR — Joao's five-class onboarding path](./data/casestudies/images/eux/popv2_plan.png "bleed-xl")](./data/casestudies/images/eux/popv2_plan.png)

## Overview

Over six months I designed, tested, and iterated a guided first-week experience for new subscribers: a starting point in a library of 1,000+ workouts instead of drowning in choice. While that shipped, I overhauled the paywall in a two-week sprint, borrowing patterns from subscription apps that convert.

<div class="cs-overview">
  <table class="cs-overview-table">
    <tbody>
      <tr>
        <th scope="row">Role</th>
        <td>Senior Product Designer. Led end-to-end design across both workstreams: research, design, user testing, stakeholder alignment, and post-launch monitoring.</td>
      </tr>
      <tr>
        <th scope="row">Constraints</th>
        <td>We wanted to adopt a mining for gold approach. Trying small experiments until we found signal - and then doubling down. So we started small, and then pushed hard when we found something good.</td>
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

### The project

FitXR is a subscription VR fitness app. Before this project, new users hit a weak paywall with no clear reason to start a trial, then landed in a massive catalogue with no obvious first step. No guidance through those opening sessions. Just a wall of content.

For the paywall, we needed patterns that work and a clear value proposition. For onboarding, we needed to prove a guided path worked, then build it properly.

---

## Paths of Play

Paths of Play was our name for the guided first-week experience: a sequenced set of workouts and UI changes that replaced "here's everything, good luck" with "start here, then here."

Before V1 shipped, we'd already user tested the existing onboarding heavily: where people got lost, what they understood, and what the flow promised versus what they felt in the product. That work gave us the signal to bet on a guided path.

### V1: something in their hands (March 2025)

V1 tested two ideas, personalisation and simplification, with a third we were starting to explore.

On personalisation: did people engage more when the opening session felt made for them? Every new user got a tailored first workout and a simple plan for the week ahead. We added a short calibration step, a moment to choose what kind of workout they wanted to play, so it felt like their choice, not ours.

[![Calibration step — choose your first workout type](./data/casestudies/images/eux/popv1_calibration.png "wide")](./data/casestudies/images/eux/popv1_calibration.png)

On simplification: we hid complexity from new users until they were ready. Post-workout summaries were stripped back. After subscribing, you went straight into a workout, not the main menu. When you did reach the menu, you saw your plan and had to pick the next workout on it. Detailed previews didn't appear until your third session. A feature that blends the workout with your real room was introduced only when relevant. A recurring rewards programme stayed locked until you'd finished two workouts.

<figure class="cs-media cs-media--wide">
  <video autoplay loop muted playsinline preload="metadata" src="./data/casestudies/images/eux/popv1_PickingWorkout.mp4"></video>
</figure>

We were also testing a third idea, everyone's a winner. Early goals were designed to be achievable, and classes were simplified so users got a good result. The bet: let people feel successful immediately, before asking for more commitment.

The goal was momentum. Help people feel the product on day one, and convert more trials into members.

**+9% trial-to-member conversion.** More people who tried the app actually subscribed. Strongest result this team had seen in this space for a long time.

**+17% playing multiple workouts on day one.** With a guided path of just two workouts, far more new users built momentum on their first day instead of stopping after one.

One gap: that first-day engagement didn't yet lift next-day return (people coming back the day after). We kept monitoring membership and return metrics. Early samples were still small and noisy.

We rolled V1 to all English-speaking users within two weeks.

### V2: doubling down (June–August 2025)

V1 proved the guided path worked. The weak spot was return. Not enough reason to come back the next day. Our suspicion: the plan wasn't compelling enough. It blended into the rest of the app; users couldn't see what to focus on or what came next.

V2 doubled down on the signal. We built a kickstart plan that was impossible to miss. You always knew what to do next.

[![Kickstart plan ready — personalised plan and today's goal](./data/casestudies/images/eux/popv2_Kickstart%20Plan%20Ready.png "wide")](./data/casestudies/images/eux/popv2_Kickstart%20Plan%20Ready.png)

We day-gated every two days, a hook to come back, not just pacing for its own sake. We locked down more of the product so users stayed tunnel-visioned on the kickstart until they graduated. Unlock moments were designed to feel special: milestones, not permissions. Finish the plan and a celebration animation showed all your workouts merging into one collection.

[![Locked home screen — kickstart plan front and centre](./data/casestudies/images/eux/popv2_locked.png "wide")](./data/casestudies/images/eux/popv2_locked.png)

<figure class="cs-media cs-media--wide">
  <video autoplay loop muted playsinline preload="metadata" src="./data/casestudies/images/eux/popv2_kickstart_plan.mp4"></video>
</figure>

Before the A/B test, Zoe and I user tested the designs. People understood the locked model immediately. They missed one unlock beat, not realising they could browse outside the plan once it opened up, and we fixed that before ship. The sessions gave us conviction we were on the right track and that the experience held up in testing.

**+4% active on three or more days.** The kickstart plan gave people a reason to return across the first week, not just a strong first day.

Trial-to-member conversion held steady despite a critical bug midway through the test. The extra structure wasn't hurting commitment.

### V2.5: optimise (August–October 2025)

V2 had raised the floor: a huge change to onboarding, and clear signal it was working. V2.5 was about optimisation. Listen to users, reflect on the design, tighten what we'd built.

Users were loud about one thing: day gating was frustrating. Our user-test participants hadn't flagged it, but reviews gave us a clear signal it wasn't worth the trade-off. We scrapped it.

We doubled down on everyone's a winner and updated the copy to match. No more tutorial language. Wording that put people in the action already. Class 1 went from "Box Foundations" to "Make Your Move."

We upgraded the rewards. Not just more workouts. Our best environments and gloves, the kind of thing that reflects what FitXR is actually worth playing for.

A stamp system made the path legible: what to do today, what unlocks when you come back. Not just a plan floating in the UI.

[![Stamp system — daily progress and unlocks at a glance](./data/casestudies/images/eux/popv25_stamps.png "wide")](./data/casestudies/images/eux/popv25_stamps.png)

We shortened the plan. Users shouldn't feel stuck in beginner mode longer than they need to.

**+29% plan completion.** Less friction, shorter path. More people finished instead of dropping off mid-journey.

**+6% trial-to-member conversion.** Removing day gating didn't hurt commitment; optimising the experience helped.

People finished in hours, not the days we'd planned for. Users were moving faster than we'd assumed, and the shorter plan gave them room to do that.

---

## The Paywall

Midway through Paths of Play, while engineers were heads-down shipping the guided experience, I got pulled onto a sidequest: redesign the paywall entirely. Fresh direction. Fix everything broken about it. Two weeks.

The old screen gave people no obvious reason to subscribe. Value was buried. You had to work to understand what you were paying for. Copy ran full-width across a VR display built for immersion, not reading. Poor contrast made it harder still. Pricing sat in dense cards with weak hierarchy. Nothing told you where to look.

I started with competitor research outside VR, in subscription products that actually convert. Not to copy layouts. To see what makes someone feel ready to commit.

The redesign split the screen so people could skim it. F-shaped reading on a display the size of a wall. Left column: clear value tied to the fitness goal they'd already chosen, with social proof and imagery that matched them. Right column: the decision, stripped back. Annual Pass marked Recommended. Price shown weekly so the number felt manageable. Softer free-trial language so subscribing didn't feel like an ambush after onboarding. Guest pass moved out of the way. Better contrast, cleaner type, a layout that looked like something you'd want to use.

If you'd just said you want to build strength, the paywall should talk about strength, and feel like the beginning of something, not a form.

<div class="cs-media-row">
  <figure class="cs-media">
    <a href="./data/casestudies/images/eux/Paywall_Before.png"><img src="./data/casestudies/images/eux/Paywall_Before.png" alt="Paywall before — dense copy, weak hierarchy"></a>
  </figure>
  <figure class="cs-media">
    <a href="./data/casestudies/images/eux/Paywall_After.png"><img src="./data/casestudies/images/eux/Paywall_After.png" alt="Paywall after — value on the left, decision on the right"></a>
  </figure>
</div>

**+10% paywall conversion.** A sidequest done right. The paywall had been hard to move for years. This was the first time we'd shifted it, by focusing on what users actually needed at that moment.

---

## Impact

**+30% users completing at least one workout.** The guided path gave new members somewhere to start.

**+16% new user conversion.** V2.5 got out of users' way.

**+10% paywall conversion.** The paywall finally reflected the person in front of it.

---

## Learnings

Three things I took away:

- **Follow signal, not the roadmap.** We started small, doubled down when V1 proved the guided path worked, then optimised when users outpaced the design in V2. Small bets until you have signal, then push hard.
- **Cut what you built when live evidence says so.** Day gating felt considered from our side. Users found it controlling. User testing hadn't flagged it, but live users did.
- **Following user needs moves metrics.** Conversion, return, plan completion, paywall: each lift came from fixing something users were struggling with, not from tuning the funnel in isolation.
