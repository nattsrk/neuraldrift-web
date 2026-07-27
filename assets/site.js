// Neural Drift — site behaviour. No dependencies, no trackers.
(function () {
  var burger = document.getElementById('burger');
  var nav = document.getElementById('navlinks');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Contact form -> composes a pre-filled email. Nothing is stored or sent by this page.
  var form = document.getElementById('cform');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = function (id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };
      var body =
        'Name: ' + g('f-name') +
        '\nCompany: ' + g('f-co') +
        '\nVessel/IMO: ' + g('f-imo') +
        '\nInterest: ' + g('f-int') +
        '\n\n' + g('f-msg');
      location.href =
        'mailto:fleet@neuraldrifts.com?subject=' +
        encodeURIComponent('[neuraldrifts.com] ' + g('f-int')) +
        '&body=' + encodeURIComponent(body);
    });
  }
})();
