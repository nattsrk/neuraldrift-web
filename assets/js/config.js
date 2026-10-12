/* Neural Drift website settings. Change only the values after the colons; keep the quotes and commas. */
window.ND_CONFIG = {
  // Optional: a web address that receives the contact form as JSON (your own form service).
  // Leave empty and the form opens the visitor's own e-mail app, addressed to fleet@neuraldrifts.com.
  formEndpoint: '',

  // Rule 26 of the Companies (Incorporation) Rules, 2014: the name and designation of the person to contact
  // for queries and grievances. It appears in the footer and on the Contact page. Example: 'Full name, Director'
  grievanceContact: '',

  // true once the four portraits are in the media folder: team-gokula.jpg, team-arun.jpg, team-viknesh.jpg,
  // team-ameen.jpg (4:5, at least 800 px wide, each with the person's permission). Until then, engraved initials show.
  teamPhotos: false,

  // Testimonials appear only when every field is filled and the speaker has agreed the exact words in writing.
  // One entry per quote, for example:
  // { quote: 'The exact words agreed', name: 'Full name', role: 'Role', company: 'Company', agreed: '2026-10-08' },
  testimonials: [
  ]
};
