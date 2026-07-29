# Guide Demo Header Polish

**Date:** 2026-07-29  
**Status:** approved by Product Owner in conversation  
**Scope:** shared `GuideApp` presentation and public demo modal

## Goal

Affiner l'équilibre visuel du guide smartphone sans modifier ses données, sa
navigation interne, ses routes privées ou ses contrôles d'accès.

## Guide Home Quick Cards

The “Arrivée” and “Wi-Fi” quick cards keep their current dimensions,
interactions and Lucide pictograms. Their icon containers change from pink to
neutral slate:

- icon background: `slate-100`;
- icon foreground: `slate-600`;
- labels and values remain unchanged.

This neutral treatment applies only to these two informational shortcuts. The
pink brand accent remains available for editorial highlights and calls to
action.

## Guide Header

The shared Guide header uses the approved MyStay monogram instead of the
horizontal logo:

- approved asset through `MyStayLogo form="mark"`;
- no “mystay” wordmark beside the monogram;
- monogram displayed at approximately 50 px wide;
- “Saint-Gervais-les-Bains” remains below the monogram;
- header height increases to 68 px to preserve breathing room;
- the internal home action, demo badge and menu button remain unchanged.

The same shared presentation is used in private and demo modes so the two
guides do not diverge.

## Demo Modal

The floating visual close button is removed. The modal remains dismissible by:

- pressing `Escape`;
- clicking the blurred overlay.

Clicking inside the phone never closes it. Radix Dialog continues to manage
the focus trap, scroll lock, dialog semantics and focus restoration. Initial
focus moves to the first interactive guide control instead of a close button.

## Testing

- component test for neutral quick-card icon colors;
- GuideHeader test for the approved monogram, larger dimensions, retained city
  and internal home action;
- modal test confirming the floating close control is absent while `Escape`
  still closes and restores focus;
- existing navigation and responsive tests remain green.

## Out of Scope

- changing the bottom navigation;
- removing the internal menu button;
- changing private guide access rules;
- changing the demo data or POI collection;
- adding a public guide route.
