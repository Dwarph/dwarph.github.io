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

### V1 — something in their hands *(March 2025)*

V1 tested two ideas — **personalisation** and **simplification** — with a third we were starting to explore.

**Personalisation:** did people engage more when the opening session felt made for them? Every new user got a tailored first workout and a simple plan for the week ahead. We added a short calibration step — a moment to choose what kind of workout they wanted to play, so it felt like their choice, not ours.

**Simplification:** we hid complexity from new users until they were ready. Post-workout summaries were stripped back. After subscribing, you went straight into a workout — not the main menu. When you did reach the menu, you saw your plan and had to pick the next workout on it. Detailed previews didn’t appear until your third session. A feature that blends the workout with your real room was introduced only when relevant. A recurring rewards programme stayed locked until you’d finished two workouts.

We were also testing a third idea — **everyone's a winner**. Opening workouts were easier than usual. Early goals were designed to be achievable. The bet: let people feel successful immediately, before asking for more commitment.

Early signals were good. People played more workouts and finished more of them. We rolled it to all English-speaking users within two weeks.

### V2 — structure *(June–August 2025)*

V1 showed people would follow a path. V2 tested whether more structure would deepen that.

We added locked future workouts, one-workout-per-day pacing, a beginner starter programme, themed tracks by music and difficulty, and achievement badges on workout cards to encourage repeats. One clear route through the first week became a proper guided journey.

Before the A/B test, Zoe and I ran user testing on the designs. People understood locked content immediately — no explanation needed. But they missed the unlock moment. They didn’t realise they could now browse workouts outside the plan. We fixed that before we shipped.

[![Paths of Play V2 designs](./data/casestudies/images/early-ux/pop-v2.png "wide")](./data/casestudies/images/early-ux/pop-v2.png)

Results: average active days went up. Users active on three or more days rose from 14% to 18%. Trial-to-subscriber conversion held steady despite a critical bug midway through the test. The structure was working.

### V2.5 — getting out of the way *(August–October 2025)*

Here's what we built: one workout per day. Here's what users told us: the experience felt long and flat. Here's what the data confirmed: they were moving faster than we'd expected.

We were getting in their way.

The call was counterintuitive. Remove the daily limit. Trust people to move at their own pace. Stop trying to control the journey and start making it worth completing.

Instead of forced pacing, we offered earned rewards: stamps for progress, new workout locations to unlock, and a social mode opened after the plan. The home screen got a redesign. One workout was cut. The whole thing got shorter and sharper.

[![Paths of Play V2.5 designs](./data/casestudies/images/early-ux/pop-v2-5.png "wide")](./data/casestudies/images/early-ux/pop-v2-5.png)

Users completed the plan in an average of 18 hours. We'd designed it for days.

Trial-to-subscriber conversion rose by 6 percentage points, statistically significant. Plan completion went from 37% to 66%. 85% of users who finished went straight into the full library, playing an average of 8 more workouts.

---

## The Paywall

Same question. Different screen.

The old subscription screen didn't know who you were. Generic copy. Generic imagery. A feature list. It was speaking to everyone, which meant it was speaking to no one. But there was a bigger problem: it didn't feel like a moment. You'd just answered questions about your goals and seen a plan built around them — then you hit a screen that felt like a form.

Before touching the design, I studied how the best subscription products handle this moment — what patterns work, what they have in common. The through-line was clear. The best ones feel *special*. They treat subscribing as the start of something, not a transaction to rush through.

The redesign tried to do the same. Two columns. Left: benefits and imagery matched to the fitness goal you'd chosen, with background imagery tailored by gender. Right: the annual plan front and centre, price shown as a weekly cost, social proof that felt believable. Cleaner copy. More confidence.

The logic was simple. If you'd just said you want to build strength, the screen should talk about strength — and feel like a beginning, not a checkout.

[![Paywall redesign](./data/casestudies/images/early-ux/paywall.png "wide")](./data/casestudies/images/early-ux/paywall.png)

Clicks on Start Free Trial went from 55.3% to 58.8%. The strongest signal came from men who'd chosen strength as their goal — exactly the group the screen now spoke to.

+1.3 percentage points on the trial button. ~+10% subscription conversion overall.

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
