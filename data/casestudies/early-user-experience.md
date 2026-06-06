[![Early User Experience - header](./data/casestudies/images/early-ux/header.png "bleed-xl")](./data/casestudies/images/early-ux/header.png)

## Overview

Over six months I designed, tested, and iterated a guided first-week experience for new subscribers — helping them find a starting point in a library of 1,000+ workouts instead of drowning in choice. While that shipped, I also overhauled the paywall in a two-week sprint, using patterns from the best apps elsewhere.

<div class="cs-overview">
  <table class="cs-overview-table">
    <tbody>
      <tr>
        <th scope="row">Role</th>
        <td>Senior Product Designer. Led end-to-end design across both workstreams — research, design, user testing, stakeholder alignment, and post-launch monitoring.</td>
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

FitXR is a subscription VR fitness app — think Peloton, but in a headset, with over 1,000 on-demand workouts across boxing, dance, HIIT, and more.

Before this project, new users hit a weak paywall with no clear reason to start a trial, then landed in a massive catalogue with no obvious first step. No guidance through those opening sessions. Just a wall of content.

For the paywall, we needed proven patterns and a clear value proposition. For onboarding, we needed to prove that a guided path worked — then build it properly.

---

## Paths of Play

Paths of Play was our name for the guided first-week experience: a sequenced set of workouts and UI changes that replaced “here’s everything, good luck” with “start here, then here.”

Before V1 shipped, we’d already run deep user testing on the **existing onboarding** — where people got lost, what they understood, and what the flow promised versus what they felt in the product. That work gave us the signal to bet on a guided path.

### V1 — something in their hands *(March 2025)*

V1 tested two ideas — **personalisation** and **simplification** — with a third we were starting to explore.

**Personalisation:** did people engage more when the opening session felt made for them? Every new user got a tailored first workout and a simple plan for the week ahead. We added a short calibration step — a moment to choose what kind of workout they wanted to play, so it felt like their choice, not ours.

**Simplification:** we hid complexity from new users until they were ready. Post-workout summaries were stripped back. After subscribing, you went straight into a workout — not the main menu. When you did reach the menu, you saw your plan and had to pick the next workout on it. Detailed previews didn’t appear until your third session. A feature that blends the workout with your real room was introduced only when relevant. A recurring rewards programme stayed locked until you’d finished two workouts.

We were also testing a third idea — **everyone's a winner**. Early goals were designed to be achievable, and classes were simplified to ensure users got a good result. The bet: let people feel successful immediately, before asking for more commitment.

The goal was momentum — help people feel the product on day one, and convert more trials into members.

**+9% trial-to-member conversion.** More people who tried the app actually subscribed — the strongest result this team had seen in this space for a long time.

**+17% playing multiple workouts on day one.** With a guided path of just two workouts, far more new users built momentum on their first day instead of stopping after one.

One gap: that first-day engagement didn't yet lift **next-day return** (people coming back the day after). We kept monitoring membership and return metrics — early samples were still small and noisy.

We rolled V1 to all English-speaking users within two weeks.

### V2 — doubling down *(June–August 2025)*

V1 proved the guided path worked. The weak spot was **return** — not enough reason to come back the next day. Our suspicion: the plan wasn’t compelling enough. It blended into the rest of the app; users couldn’t see what to focus on or what came next.

V2 doubled down on the signal. We built a **kickstart plan** — premium, big, bold, obvious. You always knew what to do next.

We **day-gated every two days** — a hook to come back, not just pacing for its own sake. We locked down more of the product so users stayed tunnel-visioned on the kickstart until they graduated. **Unlock moments** were designed to feel special — milestones, not permissions. Finish the plan and a celebration animation showed all your workouts merging into one collection.

Before the A/B test, Zoe and I user tested the designs. People understood the locked model immediately. They missed one unlock beat — not realising they could browse outside the plan once it opened up — and we fixed that before ship. The sessions gave us conviction we were on the right track and that the experience was usable at a high bar.

[![Paths of Play V2 designs](./data/casestudies/images/early-ux/pop-v2.png "wide")](./data/casestudies/images/early-ux/pop-v2.png)

**+4% active on three or more days.** The kickstart plan gave people a reason to return across the first week — not just a strong first day.

Trial-to-member conversion held steady despite a critical bug midway through the test — the extra structure wasn’t hurting commitment.

### V2.5 — optimise *(August–October 2025)*

V2 had raised the floor — a huge change to onboarding, and clear signal it was working. V2.5 was about **optimisation**: listening to users, reflecting on the design, and tightening what we’d built.

Users were loud about one thing: **day gating was frustrating**. Our user-test participants hadn’t flagged it — but reviews gave us a clear signal it wasn’t worth the trade-off. We scrapped it.

We doubled down on **everyone's a winner** and updated the copy to match. No more tutorial language — wording that put people in the action already. Class 1 went from “Box Foundations” to “Make Your Move.”

We upgraded the rewards. Not just more workouts — **our best environments and gloves**, the kind of thing that reflects what FitXR is actually worth playing for.

A **stamp system** made the path legible: what to do today, what unlocks when you come back — not just a plan floating in the UI.

We **shortened the plan**. Users shouldn’t feel stuck in beginner mode longer than they need to.

[![Paths of Play V2.5 designs](./data/casestudies/images/early-ux/pop-v2-5.png "wide")](./data/casestudies/images/early-ux/pop-v2-5.png)

**+29% plan completion.** Less friction, shorter path — more people finished instead of dropping off mid-journey.

**+6% trial-to-member conversion.** Removing day gating didn’t hurt commitment; optimising the experience helped.

People finished in hours, not the days we’d planned for — users were moving faster than we had assumed - but the plan now gave them the agency to do so.

---

## The Paywall

Midway through Paths of Play, while engineers were heads-down shipping the guided experience, I got pulled onto a sidequest: redesign the paywall entirely. Fresh direction. Fix everything that was broken about it. Two weeks.

### What was wrong

The old screen gave people no obvious reason to subscribe. Value was buried — you had to work to understand what you were paying for. Copy ran full-width across a VR display built for immersion, not reading. Poor contrast made it harder still. Pricing sat in dense cards with weak hierarchy; nothing told you where to look or what mattered.

### What we did

I started with deep competitor research — outside VR, in subscription products that actually convert. Not to copy layouts, but to understand what makes someone feel ready to commit: clarity over cleverness, warmth over checkout.

The redesign came from a mindset of user empathy first. Split the screen so people could skim it — F-shaped reading on a display the size of a wall. Left column: clear value, tied to the fitness goal they'd already chosen, with social proof and imagery that reflected them — not a generic subscriber. Right column: the decision, stripped back. Annual Pass marked Recommended. Price shown weekly so the number felt manageable, not alarming. Softer free-trial language so subscribing didn't feel like an ambush after onboarding. Guest pass moved out of the way. Better contrast, cleaner type, a layout that felt exciting enough to lean into and trustworthy enough to believe.


[![Paywall redesign](./data/casestudies/images/early-ux/paywall.png "wide")](./data/casestudies/images/early-ux/paywall.png)

### The payoff

**+10% paywall conversion.** A sidequest done right. The paywall had historically been impossible to shift numbers on - this was the first time we'd successfully done so - through focusing on user needs.

---

## Impact

[![Impact](./data/casestudies/images/early-ux/impact.png "bleed-xl")](./data/casestudies/images/early-ux/impact.png)

Three metrics. All moved.

**+30% users completing at least one workout.** The guided path gave new members somewhere to start.

**+16% new user conversion.** V2.5 trusted users enough to get out of their way.

**+10% subscription conversion.** The subscribe screen finally reflected the person in front of it.

Three things I took away:

- **The user is the hero.** My job wasn't to build a journey and expect people to follow it. It was to understand where users were trying to go, then remove what was stopping them.
- **Cut what isn't working — even if you built it.** Daily pacing felt considered from our side. Users found it controlling. Building something and then cutting it, when the evidence points that way, is the job.
- **Shipping is the beginning.** V1 told us something. V2 told us something else. V2.5 came from listening to what users did with V2. If you care about your users, you don't declare victory and move on. You stay curious about what they're experiencing — and keep going back.
