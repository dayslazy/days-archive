// ─────────────────────────────────────────────────────────────
//  day_ — edit this file to update the site. no code needed.
// ─────────────────────────────────────────────────────────────

window.SITE = {
  // the "elsewhere" page. add, remove or reorder as you like.
  //   label  → what it is (discord, email, ...)
  //   handle → what people see (your @, address, username)
  //   url    → where clicking goes. for email use "mailto:you@example.com".
  //   copy   → instead of a link, clicking copies this text (good for discord)
  //   leave both url and copy "" to show "soon".
  elsewhere: [
    { label: "discord", handle: "dayslazy", url: "", copy: "dayslazy" },
  ],

  // optional custom background. drop a file in /assets and put its path here,
  // e.g. image: "assets/bg.jpg"  or  video: "assets/bg.mp4"
  // leave both empty to use the built-in foggy street scene.
  background: {
    image: "assets/bg.gif",
    video: "",
  },

  scene: {
    rain: true, // faint rain over the background
  },

  // music player. put mp3s in assets/music and list them here.
  // the first one always plays first when someone clicks to enter,
  // then they go in order and loop back. missing files get skipped.
  tracks: [
    { title: "Convenience", artist: "Jaydes", src: "assets/music/convenience.mp3" },
    // { title: "song name", artist: "artist", src: "assets/music/song.mp3" },
  ],

  // the "inquiries" form. messages are sent through formsubmit.co (free, no
  // account) to the email at the end of the endpoint.
  //   the very first message sends an "activate form" email to that inbox —
  //   click Activate in it, then every message after arrives normally.
  //   after activating, formsubmit gives you a random code you can use in
  //   place of the email (…/ajax/that-code) so your address isn't in the code.
  inquiries: {
    endpoint: "https://formsubmit.co/ajax/auraboi88@gmail.com",
    email: "",
  },

  // the "reviews" page. newest first.
  //   text    → what they said
  //   name    → who said it
  //   project → which site it was for (optional)
  //   stars   → 1–5 (optional, leave out to hide)
  reviews: [
    { text: "placeholder — replace this with a real review.", name: "name", project: "UFF LEAGUE WEB", stars: 5 },
  ],

  // past website designs. newest first.
  //   url   → the live site (leave "" to show "soon")
  //   image → a screenshot, e.g. "assets/work/nycc.jpg" (leave "" for a placeholder)
  work: [
    { name: "UFF LEAGUE WEB", kind: "flag football league", year: "10/17/26", url: "https://uffleague.github.io/#/", image: "assets/work/uff.png" },
    { name: "Archived #1", kind: "", year: "", url: "", image: "" },
    { name: "Archived #2", kind: "", year: "", url: "", image: "" },
  ],
};
