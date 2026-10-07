"""Page content for neuraldrifts.com. Writes _src/pages/*.html; then run build.py.

Content source: the agreed sitemap (Neural-Drift-Website-Sitemap_V01.html, rev C), worded from
Vicky's v2 draft. Rules: Neural Drift = company, GE6 Engine = product; no status labels;
nothing implies a feature is live; no internals; British English.
"""
import pathlib

OUT = pathlib.Path(__file__).parent / 'pages'
OUT.mkdir(exist_ok=True)


def I(n, cls='icon'):
    return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="#i-{n}"/></svg>'


ARW = I('arrow')
GE6 = ('<svg class="ge6-mark" viewBox="0 0 252 128" role="img" aria-label="GE6"><text x="2" y="112" font-family="JetBrains Mono, monospace" font-weight="700" font-size="120" letter-spacing="-3">'
       '<tspan fill="#10B981">GE</tspan><tspan fill="currentColor">6</tspan><tspan fill="#10B981" font-size="60" dy="-40">°</tspan></text></svg>')
LOCKUP = (pathlib.Path(__file__).parent / 'partials/ge6-lockup-dark.svg.html').read_text()


def ph(slot, what, ratio='4 / 3', alt=''):
    return (f'<figure class="ph rv" data-slot="{slot}" data-alt="{alt or what}" style="--r:{ratio}">'
            f'<figcaption title="media/{slot}.jpg">{I("photo")}<span>Photo · {what}</span></figcaption></figure>')


def page(name, title, desc, body):
    (OUT / f'{name}.html').write_text(
        f'<article class="page" id="page-{name}" data-title="{title}" data-description="{desc}">\n{body.strip()}\n</article>\n')


def crumbs(*items):
    li = ''.join(f'<li><a href="{h}">{t}</a></li>' if h else f'<li><span aria-current="page">{t}</span></li>' for t, h in items)
    return f'<ol class="crumbs">{li}</ol>'


def headph(head, slot, what, ratio="16 / 10"):
    return f'<div class="headph"><div class="head rv">{head}</div>{ph(slot, what, ratio)}</div>'


def tabs(items, active, label, spy=False):
    """Pinned strip of sibling pages or sections; the current one is filled. items: (key, small, name, href, icon)."""
    out = []
    for key, small, name, href, icon in items:
        on = key == active
        cur = ' aria-current="page"' if on and not spy else ''
        sm = small + (' · You are here' if on and not spy else '')
        out.append(f'<a class="tab{" on" if on else ""}" href="{href}" data-tab="{key}"{cur}><span class="tab-ico">{I(icon)}</span><span><small>{sm}</small>{name}</span></a>')
    return f'<nav class="tabs{" spy" if spy else ""}" aria-label="{label}"><div class="tabs-in">{"".join(out)}</div></nav>'


GE6_TABS = [('overview', 'GE6 Solutions', 'Overview', '/ge6/', 'office'),
            ('voyage', 'Module 01', 'Voyage Optimization', '/ge6/voyage-optimization/', 'route'),
            ('compliance', 'Module 02', 'Fleet Compliance', '/ge6/fleet-compliance/', 'carbon'),
            ('analytics', 'Module 03', 'Predictive Analytics', '/ge6/predictive-analytics/', 'hull')]
SERVE_TABS = [('bulk', 'Ship type', 'Bulk carriers', '#bulk', 'ship'), ('tanker', 'Ship type', 'Tankers', '#tanker', 'ship'),
              ('container', 'Ship type', 'Container ships', '#container', 'ship'), ('gas', 'Ship type', 'Gas carriers', '#gas', 'ship'),
              ('general', 'Ship type', 'General cargo', '#general', 'ship'), ('users', 'Inside your company', 'Who uses GE6', '#users', 'users')]
COMPANY_TABS = [('about', 'Company', 'About Neural Drift', '/company/#about', 'bridge'), ('leadership', 'Company', 'Leadership', '/company/#leadership', 'users'),
                ('contact', 'Company', 'Contact us', '/contact/', 'mail')]


FEAT_CARDS = {
    'voyage': [('routing', 'route', 'Weather routing', 'Route options compared before the ship sails.'),
               ('watch', 'wind', 'Live Watchkeeper', 'The weather ahead of every ship, in plain words.'),
               ('reroute', 'bridge', 'Reroute options', 'Alternatives beside the Master’s own route.')],
    'compliance': [('carbon', 'carbon', 'EU ETS and FuelEU Maritime', 'Allowances and penalties in euros, per voyage.'),
                   ('cii', 'stamp', 'CII and IMO DCS', 'This year’s rating and the path to 2030.'),
                   ('biofouling', 'hull', 'Biofouling entry rules', 'The next port’s rules, in time to act.')],
    'analytics': [('hull', 'hull', 'Hull performance', 'The state of the hull, voyage by voyage.'),
                  ('clean', 'wrench', 'Hull-clean timing', 'When a clean pays back.'),
                  ('voyage', 'report', 'Voyage analysis', 'Planned against actual, ready to send.')],
}


def feat_cards(key):
    return '<div class="wrap fcards">' + ''.join(
        f'<a class="fcard" href="#{fid}"><span class="fc-ico">{I(ic)}</span><span class="fc-n">{i:02d}</span><h3>{n}</h3><p>{line}</p><span class="more">See how {ARW}</span></a>'
        for i, (fid, ic, n, line) in enumerate(FEAT_CARDS[key], 1)) + '</div>'


def cta(title='Talk to us about your fleet', text='Tell us about your ships and what you want to look at first. A member of the team replies.', interest='', light=False):
    return f'''<section class="cta-band" aria-label="{title}">
  {ph("cta-band", "wide horizon at dusk, calm sea", "21 / 9")}
  <div class="wrap cta-in rv">
    <div><h2>{title}</h2><p>{text}</p></div>
    <div class="btns"><a class="btn" href="/contact/">Talk to us {ARW}</a><a class="btn btn-line" href="mailto:fleet@neuraldrifts.com">fleet@neuraldrifts.com</a></div>
  </div>
</section>'''



MODS = [
    dict(slug='voyage-optimization', key='voyage', n='01', name='Voyage Optimization', icon='route',
         line='Plan, watch and reroute with the weather ahead in view.',
         feats=[('routing', 'Weather routing'), ('watch', 'Live Watchkeeper'), ('reroute', 'Reroute options')]),
    dict(slug='fleet-compliance', key='compliance', n='02', name='Fleet Compliance', icon='carbon',
         line='Know the carbon exposure of every ship while there is still time to act.',
         feats=[('carbon', 'EU ETS and FuelEU Maritime'), ('cii', 'CII and IMO DCS'), ('biofouling', 'Biofouling entry rules')]),
    dict(slug='predictive-analytics', key='analytics', n='03', name='Predictive Analytics', icon='hull',
         line='See fouling, fuel and performance before they cost you.',
         feats=[('hull', 'Hull performance'), ('clean', 'Hull-clean timing'), ('voyage', 'Voyage analysis')]),
]

SEGS = [
    ('bulk', 'Bulk carriers', 'Capesize to Handysize', 'voyage-optimization', 'Voyage Optimization',
     ['Long ocean passages where the weather decides the voyage', 'Speed and consumption warranties in the charter party', 'Time at anchor, which adds to hull fouling']),
    ('tanker', 'Tankers', 'Crude, product and chemical', 'fleet-compliance', 'Fleet Compliance',
     ['Laden passages where weather costs time and fuel', 'Performance claims under the charter party', 'Calls at EU and EEA ports, priced under EU ETS']),
    ('container', 'Container ships', 'Feeder to the largest ships', 'predictive-analytics', 'Predictive Analytics',
     ['Schedules and port windows that leave little slack', 'High fuel burn, so small losses add up', 'Many port calls, each with its own rules']),
    ('gas', 'Gas carriers', 'LNG and LPG', 'fleet-compliance', 'Fleet Compliance',
     ['Long ocean passages, often in open water', 'Fuel choices that count under FuelEU Maritime', 'Performance under the charter party']),
    ('general', 'General cargo', 'General cargo and multipurpose', 'fleet-compliance', 'Fleet Compliance',
     ['Varied trades and many different ports', 'Entry rules that change from port to port', 'Lean teams ashore']),
]

USERS = [
    ('users', 'Owners and operators', 'Fuel, carbon and hull cost across the fleet, ship by ship.'),
    ('office', 'Ship managers', 'The exceptions first, across every ship you manage.'),
    ('wrench', 'Technical superintendents', 'Hull condition, the right time to clean, the next port’s entry rules.'),
    ('contract', 'Commercial and chartering', 'Voyage cost in fuel, time and carbon, and reports ready to send.'),
    ('carbon', 'Fleet performance and ESG', 'CII, EU ETS and FuelEU positions for each ship, with the path to 2030.'),
    ('bridge', 'Masters and officers', 'The weather ahead in plain words. The decisions stay on board.'),
]

PRINCIPLES = [
    ('A blank is never a zero', 'Where a figure is missing, the screen says so and why. Nothing is estimated in its place.'),
    ('Every figure keeps its source', 'Each figure shows where it came from, on the screen and in every export.'),
    ('The Master decides on board', 'We compute and offer. Nothing we show is an instruction to the ship.'),
    ('The verifier’s figure counts', 'We compute from the data on file. The official figures are the ones your verifier issues.'),
    ('Every time carries its zone', 'Ship’s time and office time are always shown with their zone. Nothing is left to guess.'),
    ('Plain words first', 'The sentence a superintendent, a surveyor and a charterer can all follow, then the term of art.'),
]


def principles(items, cls=''):
    return f'<ol class="princ {cls}">' + ''.join(
        f'<li class="rv"><span class="n">{i:02d}</span><div><h3>{h}</h3><p>{p}</p></div></li>' for i, (h, p) in enumerate(items, 1)) + '</ol>'


def steps():
    return '''<div class="steps">
  <div class="step rv"><h3>Conversation</h3><p>We learn your fleet, your trades and what matters to you first.</p></div>
  <div class="step rv"><h3>Pilot</h3><p>Start with a few ships and the module that pays first.</p></div>
  <div class="step rv"><h3>Fleet</h3><p>Add ships and modules on the same record, at your pace.</p></div>
</div>'''


CHART = '''<div class="chart rv" aria-hidden="true">
<svg viewBox="0 0 560 560" preserveAspectRatio="xMidYMid slice">
  <g class="contour">
    <path d="M-20 120 C 90 80, 180 150, 300 110 S 520 60, 600 100"/><path d="M-20 160 C 100 120, 190 190, 310 150 S 520 100, 600 140"/>
    <path d="M-20 430 C 120 470, 230 400, 350 440 S 520 500, 600 460"/><path d="M-20 470 C 120 510, 240 440, 360 480 S 520 540, 600 500"/>
    <path d="M-20 510 C 130 550, 250 480, 370 520 S 520 580, 600 540"/>
  </g>
  <g class="storm"><circle cx="300" cy="285" r="92"/><circle cx="300" cy="285" r="64"/><circle cx="300" cy="285" r="36"/></g>
  <path class="plan" d="M78 330 C 170 300, 230 290, 300 285 S 430 270, 488 232"/>
  <path class="route" d="M78 330 C 140 360, 190 420, 300 412 S 440 330, 488 232"/>
  <circle class="port" cx="78" cy="330" r="8"/><circle class="port" cx="488" cy="232" r="8"/>
  <circle class="ship" cx="226" cy="408" r="9"/>
</svg>
<div class="chart-tag t1"><i>''' + I('wind') + '''</i><span>Weather ahead<small>in plain words</small></span></div>
<div class="chart-tag t2"><i>''' + I('carbon') + '''</i><span>Carbon per voyage<small>in euros</small></span></div>
<div class="chart-tag t3"><i>''' + I('hull') + '''</i><span>Hull condition<small>and the cost of waiting</small></span></div>
<div class="chart-key"><span>Planned</span><span>Option</span></div>
</div>'''


def fit_section():
    ins = [('report', 'Noon and event reports'), ('position', 'Ship positions'), ('wind', 'Weather and sea forecasts'),
           ('fuel', 'Bunker delivery notes'), ('contract', 'Charter-party terms'), ('wrench', 'Hull-clean and inspection records')]
    outs = [('office', 'The office: exceptions first, across the fleet'), ('bridge', 'The bridge: the weather ahead, in plain words'),
            ('send', 'Owners and charterers: voyage reports ready to send'), ('stamp', 'Verifiers: every figure with its source on file')]
    li = lambda xs: '<ul class="fit-list">' + ''.join(f'<li>{I(i)}{t}</li>' for i, t in xs) + '</ul>'
    mods = ''.join(f'<a href="/ge6/{m["slug"]}/">{m["name"]}{ARW}</a>' for m in MODS)
    return f'''<section class="sec" aria-labelledby="fit-h"><div class="wrap">
  {headph('<p class="kicker">How GE6 fits</p><h2 id="fit-h">From what your ships already report, to a decision ashore and on board</h2><p class="lead">GE6 Engine works from the data your fleet already produces. Nothing to install on board.</p>', "ge6-fit", "officer filing the noon report on board")}
  <div class="fit rv">
    <div class="fit-col"><p class="fit-k">In</p><h3>What the fleet already produces</h3>{li(ins)}</div>
    <div class="fit-arrow">{I('arrow')}</div>
    <div class="fit-col fit-core"><p class="fit-k">GE6 Engine</p><h3>One record per ship</h3><p>Every figure keeps its source. A missing figure is shown as missing, never estimated.</p><div class="fit-mods">{mods}</div></div>
    <div class="fit-arrow">{I('arrow')}</div>
    <div class="fit-col"><p class="fit-k">Out</p><h3>Who acts on it</h3>{li(outs)}</div>
  </div>
</div></section>'''


# ── Home ─────────────────────────────────────────────────────────────────
mods_cards = ''.join(f'''<a class="mod rv" href="/ge6/{m["slug"]}/">
  {ph("pillar-" + m["key"], {"voyage": "ship under way, weather ahead", "compliance": "ship alongside in port", "analytics": "hull below the waterline"}[m["key"]], "16 / 10")}
  <span class="mod-ico">{I(m["icon"])}</span><span class="mod-n">MODULE {m["n"]}</span><h3>{m["name"]}</h3><p>{m["line"]}</p>
  <ul class="feat">{"".join(f"<li>{f}</li>" for _, f in m["feats"])}</ul><span class="more">Explore {m["name"]} {ARW}</span></a>''' for m in MODS)

seg_cards = ''.join(f'''<a class="seg rv" href="/who-we-serve/#{k}">{ph("segment-" + k, n.lower(), "3 / 4")}<h3>{n}</h3><p>{sub}</p></a>''' for k, n, sub, *_ in SEGS)

page('index', 'Neural Drift · GE6 Solutions for voyage, carbon and hull performance',
     'Every voyage holds countless paths. GE6 by Neural Drift measures them before they cost you, or the sea.', f'''
<section class="story" id="story" aria-label="Neural Drift">
  <div class="story-pin">
    <div class="stage" id="stage">
      <video id="story-vid" muted playsinline preload="auto" aria-hidden="true" src="/media/NeuralDriftHomepage%20Video.mp4"></video>
      <svg class="route" id="route" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <path class="straight" d="M180 620 L1420 300"/>
        <path class="least" id="least" d="M180 620 C 460 760, 760 760, 980 560 S 1300 300, 1420 300"/>
        <circle cx="180" cy="620" r="10"/><circle cx="1420" cy="300" r="10"/>
      </svg>
      <h1 class="line" data-in=".10" data-out=".32" tabindex="-1">Every voyage holds <em>countless paths.</em></h1>
      <p class="line" data-in=".32" data-out=".54">Nature keeps the path of <em>least action.</em></p>
      <p class="line" data-in=".54" data-out=".80">Measured before it costs you, <em>or the sea.</em></p>
      <div class="final" id="final">
        <img class="logo-big" src="/assets/brand/logo_horizontal_dark.svg" alt="Neural Drift" width="420" height="105">
        <p class="say">Only when we act does the voyage get better, for the ship and for the sea.</p>
        <div class="glass-row">
          <a class="glass" href="/ge6/voyage-optimization/"><small>GE6 · 01</small><b>Voyage Optimization</b><span>Plan, watch and reroute.</span></a>
          <a class="glass" href="/ge6/fleet-compliance/"><small>GE6 · 02</small><b>Fleet Compliance</b><span>Carbon exposure, in time to act.</span></a>
          <a class="glass" href="/ge6/predictive-analytics/"><small>GE6 · 03</small><b>Predictive Analytics</b><span>Fouling and fuel, before they cost.</span></a>
        </div>
      </div>
    </div>
    <div class="scroll-cue" id="cue" aria-hidden="true"><b>Scroll</b><span><i class="mouse"></i>to begin the voyage</span></div>
  </div>
</section>
<a class="home-brand" href="/" aria-label="Neural Drift, home"><img src="/assets/brand/logo_horizontal.svg" alt="" width="380" height="95"></a>
<div class="story-rail" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
''')

# ── GE6 Engine overview ──────────────────────────────────────────────────
ge6_rows = ''.join(f'''<article class="feature" id="{m["key"]}">
  {ph("pillar-" + m["key"], {"voyage": "ship under way, weather on the horizon", "compliance": "ship alongside in a European port", "analytics": "hull below the waterline"}[m["key"]], "4 / 3")}
  <div class="rv"><p class="f-n">Module {m["n"]}</p><h2>{m["name"]}</h2><p>{m["line"]}</p>
  <ul class="checks">{"".join(f'<li>{f}</li>' for _, f in m["feats"])}</ul>
  <div class="btns"><a class="btn" href="/ge6/{m["slug"]}/">Explore {m["name"]} {ARW}</a></div></div>
</article>''' for m in MODS)

page('ge6', 'GE6 Solutions · Neural Drift',
     'GE6 Engine: Voyage Optimization, Fleet Compliance and Predictive Analytics in one product, on one record per ship.', f'''
<section class="phero" aria-labelledby="ge6-h1"><div class="wrap phero-grid">
  <div>{crumbs(("Home", "/"), ("GE6 Solutions", None))}
    <p class="kicker">The product</p>
    <h1 id="ge6-h1" tabindex="-1" aria-label="GE6 Solutions" class="ge6-h1" style="font-size:clamp(3rem,2rem + 4.5vw,5.4rem)">{GE6}<span>Solutions</span></h1>
    <p class="lead">One product, three modules: Voyage Optimization, Fleet Compliance and Predictive Analytics, on one record per ship. Start with the module that pays first and add the rest when you are ready.</p>
    <div class="btns"><a class="btn" href="/contact/">Talk to us {ARW}</a></div>
    <nav class="jump" aria-label="Modules">{"".join(f'<a href="#{m["key"]}"><span class="n">{m["n"]}</span>{m["name"]}</a>' for m in MODS)}</nav>
  </div>
  {ph("solutions-hero", "ship under way in open water", "4 / 5")}
</div></section>
<section class="sec lt" aria-label="The three modules"><div class="wrap features">{ge6_rows}</div></section>
{fit_section()}
<section class="sec lt" aria-labelledby="pilot-h"><div class="wrap">
  {headph('<p class="kicker">Working with us</p><h2 id="pilot-h">How a pilot starts</h2><p class="lead">Priced by module and by fleet. We quote for your ships after a first conversation.</p>', "home-platform", "bridge team on watch, or an office team at work")}
  {steps()}
</div></section>
{cta()}
''')

# ── Module pages ─────────────────────────────────────────────────────────
MODPAGES = {
    'voyage': dict(
        h1='Route around the weather, not through it',
        lead='Plan the voyage, keep a watch on the weather ahead, and have the options ready when it turns. The Master decides on board.',
        desc='Weather routing, a live watch on the weather ahead and reroute options, with the Master deciding on board.',
        hero='voyage-hero', hero_what='ship in open ocean, weather building',
        outcomes=[('Fewer surprises at sea', 'Heavy weather seen hours out, not met on arrival.'), ('Fuel, time and carbon in one view', 'Every option compared on the same terms.'), ('The Master stays in command', 'We offer options. The decision is made on board.')],
        feats=[('routing', 'voyage-routing', 'ship in heavy seas, from a distance', 'Weather routing', 'Route options before the ship sails', 'The planned route and its alternatives, compared in fuel, time and carbon, so the choice is about the voyage, not the arithmetic.', ['Options compared side by side', 'Fuel, time and carbon for each', 'Ready before departure']),
               ('watch', 'voyage-watch', 'a bridge at night, officer of the watch', 'Live Watchkeeper', 'The weather ahead of every ship, in plain words', 'Position, plan and the weather coming, on one screen for the office and in plain words for the bridge. Alerts reach the ship and the office together.', ['The weather ahead in one line', 'Departures from the plan flagged', 'The same view ashore and on board']),
               ('reroute', 'voyage-reroute', 'Master and officer at the chart table', 'Reroute options', 'When the weather turns, the options are ready', 'Alternatives appear beside the Master’s own route, compared the same way. The Master selects and decides on board.', ['The Master’s route always shown', 'Options compared on one scale', 'Nothing replaces the passage plan without the Master'])],
        users=['Masters and officers', 'Superintendents and operations', 'Commercial and chartering'],
        faq=[('Does GE6 Engine replace the Master’s passage plan?', 'No. We offer options; the Master selects, checks and decides on board.'),
             ('What does the bridge see?', 'The weather ahead in plain words, for its own ship. The office sees the same picture across the fleet.'),
             ('Can we start with a few ships?', 'Yes. A pilot runs on a few ships and the module that pays first. The fleet follows on the same record.'),
             ('How is it priced?', 'By module and by fleet. We quote for your ships after a first conversation.')],
        cta='See the weather ahead of your own ships'),
    'compliance': dict(
        h1='Know the carbon exposure while there is still time to act',
        lead='EU ETS, FuelEU Maritime, CII, IMO DCS and biofouling entry rules for every ship, in one place. The figures that count are the ones your verifier issues.',
        desc='EU ETS, FuelEU Maritime, CII, IMO DCS and biofouling entry rules for every ship, in one place, in time to act.',
        hero='compliance-hero', hero_what='ship at a European port, or a funnel against the sky',
        outcomes=[('Carbon as a voyage cost', 'Allowances and penalties in euros, while the voyage can still change.'), ('Ratings kept in view', 'Each ship’s CII as the year runs, and the path to 2030.'), ('Ready for the next port', 'Biofouling entry rules known before the ship arrives.')],
        feats=[('carbon', 'compliance-carbon', 'ship alongside at a European port', 'EU ETS and FuelEU Maritime', 'Allowances and penalties in euros, per voyage', 'See what each voyage costs in EU allowances and where each ship stands against the FuelEU limit, while the route, the speed or the fuel can still change.', ['Exposure per ship and per voyage', 'In euros, not only in tonnes', 'Early enough to act']),
               ('cii', 'compliance-cii', 'a ship’s funnel or profile against open sky', 'CII and IMO DCS', 'This year’s rating, and the path to 2030', 'Each ship’s rating as the year runs, and where it lands as the line tightens. The data IMO asks for, from the same record.', ['Ships at risk shown first', 'The path to 2030 for each ship', 'One record for the rating and the report']),
               ('biofouling', 'compliance-biofouling', 'hull inspection by a diver or ROV', 'Biofouling entry rules', 'Ready before the next port asks', 'New Zealand, Australia, California, Brazil and Galápagos each check the hull on arrival. See where each ship stands against the next port’s rules, in time to inspect or clean.', ['The next port’s requirements', 'Time left to act', 'Records kept together'])],
        users=['Fleet performance and ESG', 'Commercial and chartering', 'Technical superintendents'],
        faq=[('Are your figures the official ones?', 'No. We compute from the data on file. The figures that count are the ones your verifier issues.'),
             ('Is this legal advice?', 'No. Regulation summaries are our reading for planning. The authority’s current text decides.'),
             ('Which ships does it cover?', 'Merchant ships of 5,000 GT and above, the size from which these schemes apply. Biofouling entry rules apply to ships of every size.'),
             ('How is it priced?', 'By module and by fleet. We quote for your ships after a first conversation.')],
        cta='Start with your own exposure'),
    'analytics': dict(
        h1='See fouling and fuel before they cost you',
        lead='Hull performance, the right time to clean, and how each voyage went against its plan, with the money attached.',
        desc='Hull performance, the right time to clean and voyage analysis, with the money attached.',
        hero='analytics-hero', hero_what='hull below the waterline or in dry dock',
        outcomes=[('The hull, in view', 'How the hull is performing, voyage by voyage.'), ('Cleans timed by cost', 'Booked on the figures, not the calendar.'), ('Voyages closed properly', 'Planned against actual, in a report ready to send.')],
        feats=[('hull', 'analytics-hull', 'hull in dry dock, or below the waterline', 'Hull performance', 'The state of the hull, in one figure', 'A clear measure of how the hull is performing, tracked voyage by voyage, with the trend in view.', ['Good, watch and poor, at a glance', 'The trend over recent voyages', 'Marked provisional until the data supports it']),
               ('clean', 'analytics-clean', 'hull cleaning in progress', 'Hull-clean timing', 'When a clean pays back', 'The fuel the hull is costing, set against the cost of a clean, so the work is booked on the figures, not the calendar.', ['The cost of waiting, per day', 'The payback of a clean', 'The effect on the CII rating']),
               ('voyage', 'analytics-voyage', 'an office team going through a voyage', 'Voyage analysis', 'Planned against actual, ready to send', 'Each voyage closed with time, fuel and carbon against the plan, in a report for the owner and the charterer.', ['Time, fuel and carbon against the plan', 'Performance against the charter party', 'Every figure traceable to its source'])],
        users=['Technical superintendents', 'Owners and fleet managers', 'Commercial and chartering'],
        faq=[('What do you need from our ships?', 'We agree the data with your technical team before a pilot starts.'),
             ('How soon are the figures reliable?', 'Figures are marked provisional until enough data is on file. A missing figure is shown as missing, never estimated.'),
             ('Can we start with a few ships?', 'Yes. A pilot runs on a few ships and the module that pays first. The fleet follows on the same record.'),
             ('How is it priced?', 'By module and by fleet. We quote for your ships after a first conversation.')],
        cta='What is fouling costing your fleet?'),
}

SCHEMES = '''<section class="sec" aria-labelledby="schemes-h"><div class="wrap">
  <div class="head rv"><p class="kicker">The schemes</p><h2 id="schemes-h">Five schemes, one record per ship</h2><p class="lead">Our reading at 7 Oct 2026, for planning. Not legal advice; the authority’s current text decides.</p></div>
  <table class="schemes rv"><thead><tr><th scope="col">Scheme</th><th scope="col">What it asks</th><th scope="col">Instrument</th></tr></thead><tbody>
    <tr><th scope="row">EU ETS</th><td>Allowances for emissions between EU or EEA ports and at berth, and half of those on voyages into or out of them. 2026 is the first year at 100 %.</td><td class="inst">Directive (EU) 2023/959</td></tr>
    <tr><th scope="row">FuelEU Maritime</th><td>A limit on the greenhouse-gas intensity of the energy used on board, tightening every five years.</td><td class="inst">Regulation (EU) 2023/1805</td></tr>
    <tr><th scope="row">CII</th><td>An A to E rating every year, against a line that tightens to 2030.</td><td class="inst">MARPOL Annex VI, reg. 28</td></tr>
    <tr><th scope="row">IMO DCS</th><td>Annual fuel and distance reporting, with more detail from 1 Jan 2026.</td><td class="inst">MEPC.385(81)</td></tr>
    <tr><th scope="row">Biofouling</th><td>Entry rules that check the hull before a ship is allowed alongside.</td><td class="inst">MEPC.378(80) and national rules</td></tr>
  </tbody></table>
</div></section>'''

for m in MODS:
    d = MODPAGES[m['key']]
    feats = ''.join(f'''<article class="feature" id="{fid}">
  {ph(slot, what, "3 / 2")}
  <div class="rv"><p class="f-n">{i:02d} · {fname}</p><h2>{fh}</h2><p>{fp}</p><ul class="checks">{"".join(f"<li>{x}</li>" for x in pts)}</ul></div>
</article>''' for i, (fid, slot, what, fname, fh, fp, pts) in enumerate(d['feats'], 1))
    others = ''.join(f'<a href="/ge6/{o["slug"]}/"><span class="n">{o["n"]}</span>{o["name"]}</a>' for o in MODS if o is not m)
    cover_steps = ''.join('<a href="/ge6/%s/" class="%s" aria-label="Module %s: %s"%s></a>' % (o['slug'], 'on' if o is m else '', o['n'], o['name'], ' aria-current="page"' if o is m else '') for o in MODS)
    cover_name = {'voyage': 'Voyage Optimization', 'compliance': 'Fleet Compliance', 'analytics': 'Predictive Analytics'}[m['key']]
    page(f'ge6-{m["slug"]}', f'{m["name"]} · GE6 Solutions · Neural Drift', d['desc'], f'''
<section class="cover" aria-labelledby="{m["key"]}-h1">
  <figure class="ph cover-ph" data-slot="{d["hero"]}" data-alt="{d["hero_what"]}"><figcaption title="media/{d["hero"]}.jpg">{I("photo")}<span>Photo · {d["hero_what"]}</span></figcaption></figure>
  <div class="wrap cover-in">
    {crumbs(("Home", "/"), ("GE6 Solutions", "/ge6/"), (m["name"], None))}
    <p class="cover-k">GE6 Solutions · Module {m["n"]}</p>
    <h1 id="{m["key"]}-h1" tabindex="-1" class="cover-name">{cover_name}</h1>
    <nav class="cover-steps" aria-label="GE6 modules">{cover_steps}<span>Module {int(m["n"])} of 3</span></nav>
    <div class="cover-sub"><p class="cover-h">{d["h1"]}</p><p class="lead">{d["lead"]}</p>
    <div class="btns"><a class="btn" href="/contact/">Talk to us {ARW}</a><a class="btn btn-line" href="/ge6/">All GE6 Solutions</a></div></div>
  </div>
  {feat_cards(m["key"])}
</section>
<section class="sec lt" aria-label="Features"><div class="wrap outc-row" style="margin-bottom:clamp(40px,5vw,64px)"><div class="outcomes rv">{"".join(f'<div class="outcome"><h3>{h}</h3><p>{p}</p></div>' for h, p in d["outcomes"])}</div>{ph(m["key"] + "-overview", "the module at work: office or bridge", "4 / 3")}</div><div class="wrap features">{feats}</div></section>
{SCHEMES if m["key"] == "compliance" else ""}
<section class="sec{" lt" if m["key"] == "compliance" else ""}" aria-labelledby="{m["key"]}-faq-h"><div class="wrap faq-grid">
  <div class="rv"><p class="kicker">Questions</p><h2 id="{m["key"]}-faq-h">Questions operators ask</h2>
    <p class="lead" style="margin-top:18px">Used by</p><div class="tags">{"".join(f"<span>{u}</span>" for u in d["users"])}</div>
    <p class="lead" style="margin-top:28px">Also in GE6 Engine</p><nav class="jump" aria-label="Other modules" style="margin-top:12px">{others}</nav><div style="margin-top:32px">{ph(m["key"] + "-faq", "superintendent and Master in conversation", "16 / 10")}</div></div>
  <div class="faq rv">{"".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in d["faq"])}</div>
</div></section>
{cta(d["cta"], interest=m["key"], light=m["key"] != "compliance")}
''')

# ── Who we serve ─────────────────────────────────────────────────────────
seg_rows = '<div class="ships">' + ''.join(f'''<article class="ship-card rv" id="{k}">
  {ph("segment-" + k, n.lower() + " at sea", "16 / 10")}
  <div class="ship-body"><p class="f-n">{sub}</p><h2>{n}</h2><p class="muted">What matters in this trade</p><ul class="checks">{"".join(f"<li>{x}</li>" for x in pts)}</ul>
  <a class="more" href="/ge6/{slug}/">Start with {mname} {ARW}</a></div>
</article>''' for k, n, sub, slug, mname, pts in SEGS) + '</div>'
users = ''.join(f'<div class="card rv"><span class="ico">{I(ic)}</span><h3>{h}</h3><p>{p}</p></div>' for ic, h, p in USERS)

page('who-we-serve', 'Who we serve · Neural Drift',
     'GE6 Engine is built for owners, operators, managers and charterers of bulk carriers, tankers, container ships, gas carriers and general cargo ships.', f'''
<section class="phero" aria-labelledby="serve-h1"><div class="wrap phero-grid">
  <div>{crumbs(("Home", "/"), ("Who we serve", None))}
    <p class="kicker">Who we serve</p>
    <h1 id="serve-h1" tabindex="-1">Built for the ships you run</h1>
    <p class="lead">Owners, operators, managers and charterers of merchant ships of 5,000 GT and above, and the crews who sail them. GE6 Engine is the same for every trade; what you look at first is not.</p>
    <nav class="jump" aria-label="Ship types">{"".join(f'<a href="#{k}">{n}</a>' for k, n, *_ in SEGS)}</nav>
  </div>
  {ph("serve-hero", "several ships at anchor, or a busy port from above", "4 / 5")}
</div></section>
<section class="sec lt" id="about-serve" aria-labelledby="aserve-h"><div class="wrap">
  <div class="about-grid">
    <div class="rv"><p class="kicker">Who our customers are</p><h2 id="aserve-h">The companies that answer for the voyage, the carbon and the hull</h2>
      <p class="lead" style="margin-top:18px">GE6 Engine is for the people who own, run, manage and charter merchant ships, and for the crews who sail them. One record per ship serves the owner’s office, the manager’s technical desk, the charterer’s commercial team and the bridge.</p></div>
    {ph("serve-about", "office team and fleet on screen", "4 / 3")}
  </div>
  <div class="about-facts">
    <div class="af rv"><span class="ico">{I("office")}</span><h3>Who</h3><p>Ship owners and operators, ship managers, and charterers.</p></div>
    <div class="af rv"><span class="ico">{I("ship")}</span><h3>Which ships</h3><p>Merchant ships of 5,000 GT and above, the size from which IMO DCS, CII and the EU schemes apply. Bulk, tanker, container, gas and general cargo.</p></div>
    <div class="af rv"><span class="ico">{I("route")}</span><h3>How we start</h3><p>A pilot on a few ships and the module that pays first. The rest of the fleet follows on the same record.</p></div>
  </div>
</div></section>
<section class="sec" aria-label="Ship types"><div class="wrap">{seg_rows}</div></section>
<section class="sec lt" id="users" aria-labelledby="users-h"><div class="wrap">
  <div class="divider rv" role="presentation"><span>A separate view · not a ship type</span></div>
  {headph('<p class="kicker">Who uses GE6</p><h2 id="users-h">Inside your company: one record, read by everyone who answers for the voyage</h2><p class="lead">Each person sees what their role needs, and only their own fleet.</p>', "serve-users", "people at work ashore and on board")}
  <div class="g3">{users}</div>
</div></section>
{cta(light=True)}
''')

# ── Company ──────────────────────────────────────────────────────────────
PEOPLE = [('team-gokula', 'Captain Gokula Saravanan', 'Co-founder · Chief Executive Officer', 'Master Mariner with 21 years at sea, 6 of them in command, and Designated Person Ashore.', 'https://www.linkedin.com/in/gokula-saravanan-932077440/'),
          ('team-arun', 'Chief Engineer Arun Kumar K.', 'Co-founder · Managing Director', 'Chief Engineer. Runs the company and leads the engine-room side of the product.', 'https://www.linkedin.com/in/arun-kumar-4351101b/'),
          ('team-viknesh', 'Viknesh', 'Chief Technology Officer', 'Marine engineer who sailed on oil, product and chemical tankers. Leads the development of GE6 Engine.', 'https://www.linkedin.com/in/viknesh-pilotvq-b13b6738/'),
          ('team-ameen', 'Ameen', 'Cloud Management Lead', 'Looks after the cloud GE6 Engine runs on.', 'https://www.linkedin.com/in/ameen-cloud/')]
people = ''.join(f'<div class="person rv">{ph(s, "portrait, head and shoulders", "4 / 5", n)}<h3>{n}</h3><p class="role-t">{r}</p><p>{b}</p><a href="{l}" target="_blank" rel="noopener">LinkedIn {I("arrow")}</a></div>' for s, n, r, b, l in PEOPLE)

page('company', 'Company · Neural Drift', 'Neural Drift is built by a Master Mariner, a Chief Engineer and marine engineers who have sailed.', f'''
<section class="phero" aria-labelledby="company-h1"><div class="wrap phero-grid">
  <div>{crumbs(("Home", "/"), ("Company", None))}
    <p class="kicker">Company</p>
    <h1 id="company-h1" tabindex="-1">Built by people who have kept the watch</h1>
    <p class="lead">Neural Drift is built by seafarers: a Master Mariner with 21 years at sea and 6 in command, a Chief Engineer, and marine engineers who sailed on tankers. We build the tools we wanted on board and ashore.</p>
  </div>
  {ph("company-hero", "the team together, or the view ahead from a bridge", "4 / 5")}
</div></section>
<section class="sec lt" id="about" aria-labelledby="about-h"><div class="wrap">
  <div class="about-grid">
    {ph("company-about", "founders’ time at sea: bridge or engine room", "4 / 3")}
    <div class="rv"><p class="kicker">About Neural Drift</p><h2 id="about-h">From the bridge and the engine room</h2>
      <p class="lead" style="margin-top:18px">Neural Drift is built by seafarers: a Master Mariner with 21 years at sea and 6 in command, a Chief Engineer, and marine engineers who sailed on tankers.</p>
      <p style="margin-top:14px;color:var(--ink-2)">We build the tools we wanted on board and ashore: the weather ahead in plain words, carbon priced before the voyage, and the cost of the hull made visible. That product is GE6 Engine.</p></div>
  </div>
  <div class="about-facts">
    <div class="af rv"><span class="ico">{I("bridge")}</span><h3>Built by seafarers</h3><p>Master Mariner, Chief Engineer and marine engineers who have kept the watch.</p></div>
    <div class="af rv"><span class="ico">{I("office")}</span><h3>One product</h3><p>GE6 Engine: Voyage Optimization, Fleet Compliance and Predictive Analytics.</p></div>
    <div class="af rv"><span class="ico">{I("pin")}</span><h3>Based in Chennai</h3><p>Neuraldrift Private Limited, registered in Chennai, Tamil Nadu, India.</p></div>
  </div>
</div></section>
<section class="sec" id="leadership" aria-labelledby="lead-h"><div class="wrap">
  <div class="head rv"><p class="kicker">Leadership</p><h2 id="lead-h">Founders and team</h2></div>
  <div class="people">{people}</div>
</div></section>
<section class="sec lt" id="principles" aria-labelledby="princ-h"><div class="wrap">
  {headph('<p class="kicker">How we work</p><h2 id="princ-h">Six rules that shape what we build</h2>', "company-principles", "chart table on the bridge")}
  {principles(PRINCIPLES)}
</div></section>
<section class="sec" id="facts" aria-labelledby="facts-h"><div class="wrap split" style="align-items:start">
  <div class="rv"><p class="kicker">Company facts</p><h2 id="facts-h">Neuraldrift Private Limited</h2><p class="lead" style="margin-top:18px">Neural Drift is the brand of Neuraldrift Private Limited, registered in Chennai, India.</p><div style="margin-top:32px">{ph("contact-office", "the office, or the building it is in", "16 / 10")}</div></div>
  <dl class="facts rv"><dt>Legal name</dt><dd>Neuraldrift Private Limited</dd><dt>Corporate Identity Number</dt><dd class="mono">U62099TN2026PTC198695</dd><dt>Incorporated</dt><dd>1 Oct 2026, under the Companies Act, 2013 (India)</dd><dt>Company type</dt><dd>Private company limited by shares</dd><dt>Registered office</dt><dd>WeWork Olympia Cyberspace, No. 21/22, Alandur Road, 2nd Street, Guindy Industrial Estate, Chennai 600 032, Tamil Nadu, India</dd></dl>
</div></section>
<section class="sec-sm lt" id="careers" aria-labelledby="careers-h"><div class="wrap split">
  <div class="rv"><p class="kicker">Careers</p><h2 id="careers-h">Work with us</h2></div>
  <div class="rv"><p class="lead">If you have sailed, or you build software for people who do, write to us at <a href="mailto:fleet@neuraldrifts.com?subject=Careers">fleet@neuraldrifts.com</a>.</p><div style="margin-top:28px">{ph("company-careers", "the team at work", "16 / 10")}</div></div>
</div></section>
{cta(light=True)}
''')

# ── Contact / Book a demo / Sign in ──────────────────────────────────────
SIDE = f'''<div class="side">
  <div class="card"><h3>Reach us directly</h3><ul class="lines">
    <li>{I("mail")}<a href="mailto:fleet@neuraldrifts.com">fleet@neuraldrifts.com</a></li>
    <li>{I("phone")}<a href="tel:+919962651950">+91 99626 51950</a></li>
    <li>{I("chat")}<a href="https://wa.me/919962651950" target="_blank" rel="noopener">Message us on WhatsApp</a></li>
    <li>{I("link")}<a href="https://www.linkedin.com/company/143972936/" target="_blank" rel="noopener">Neural Drift on LinkedIn</a></li></ul></div>
  {ph("contact-office", "the office, or the building it is in", "16 / 10")}
  <div class="card"><h3>Registered office</h3><ul class="lines"><li>{I("pin")}<address>Neuraldrift Private Limited<br>WeWork Olympia Cyberspace<br>No. 21/22, Alandur Road, 2nd Street<br>Guindy Industrial Estate<br>Chennai 600 032, Tamil Nadu, India</address></li></ul></div>
</div>'''


def field(fid, name, label, kind='text', req=True, auto='', err='Please fill this in.', extra=''):
    opt = '' if req else ' <span class="opt">(optional)</span>'
    r = ' required' if req else ''
    a = f' autocomplete="{auto}"' if auto else ''
    if kind == 'textarea':
        ctl = f'<textarea id="{fid}" name="{name}"{r}></textarea>'
    elif kind == 'select':
        ctl = f'<select id="{fid}" name="{name}"{r}><option value="">Choose one</option>{extra}</select>'
    else:
        ctl = f'<input id="{fid}" name="{name}" type="{kind}"{r}{a}>'
    e = f'<span class="err" id="{fid}-err">{err}</span>' if req else ''
    return f'<div class="field" data-field="{name}"><label for="{fid}">{label}{opt}</label>{ctl}{e}</div>'


def consent(p):
    return f'<div class="field" data-field="consent"><label class="consent" for="{p}-consent"><input id="{p}-consent" name="consent" type="checkbox" required><span>Neuraldrift Private Limited may use these details to reply to me. See the <a href="/legal/privacy/">privacy notice</a>.</span></label><span class="err" id="{p}-consent-err">Please tick the box so we can reply.</span></div>'


def status(p, h):
    return f'<div class="form-status" id="{p}-status" role="status" tabindex="-1"><h2>{h}</h2><p>Your e-mail app should now be open with the message written out. Send it from there and a member of the team will reply.</p><p class="fine mailto-note" style="margin-top:10px">If no e-mail window opened, write to <a href="mailto:fleet@neuraldrifts.com">fleet@neuraldrifts.com</a> or WhatsApp +91 99626 51950.</p></div>'




FLEETS = ''.join(f'<option>{r}</option>' for r in ['1 to 5 ships', '6 to 20 ships', '21 to 50 ships', '51 to 100 ships', 'More than 100 ships'])
SHIPCHIPS = ''.join(f'<label class="chip"><input type="checkbox" name="types" value="{n}"><span>{n}</span></label>' for n in ['Bulk carriers', 'Tankers', 'Container ships', 'Gas carriers', 'General cargo', 'Other'])
page('contact', 'Contact · Neural Drift', 'Tell us about your fleet. E-mail, phone, WhatsApp and the registered office of Neuraldrift Private Limited.', f"""
<section class="contact-v" aria-labelledby="contact-h1"><div class="wrap cv-grid">
  <div class="bridge rv">
    <p class="kicker">Contact us</p>
    <h1 id="contact-h1" tabindex="-1">Tell us about your fleet</h1>
    <p class="lead">Share a few details and a member of the team replies, usually within one working day.</p>
    <ul class="channels">
      <li><a href="mailto:fleet@neuraldrifts.com"><i class="ch-ico">{I("mail")}</i><span><small>E-mail</small>fleet@neuraldrifts.com</span></a></li>
      <li><a href="tel:+919962651950"><i class="ch-ico">{I("phone")}</i><span><small>Call</small>+91 99626 51950</span></a></li>
      <li><a href="https://wa.me/919962651950?text=Hello%20Neural%20Drift%2C%20I%20would%20like%20to%20talk%20about%20GE6%20Engine." target="_blank" rel="noopener"><i class="ch-ico wa">{I("whatsapp")}</i><span><small>WhatsApp</small>+91 99626 51950</span></a></li>
      <li class="office"><a href="https://www.google.com/maps/dir/?api=1&destination=WeWork%20Olympia%20Cyberspace%2C%2021/22%20Alandur%20Road%2C%20Guindy%20Industrial%20Estate%2C%20Chennai%20600032%2C%20Tamil%20Nadu%2C%20India" target="_blank" rel="noopener" aria-label="Directions to our office in Google Maps"><i class="ch-ico">{I("pin")}</i><span><small>Office · Get directions</small>Guindy, Chennai, India <em class="mono">WeWork Olympia Cyberspace · 13°00′N 080°13′E</em></span><svg class="icon go-ext" aria-hidden="true" focusable="false"><use href="#i-arrow"/></svg></a></li>
    </ul>
    <div class="bridge-logo">{LOCKUP}</div>
  </div>
  <div class="enquiry rv">
    <div class="enq-head"><p class="mono">FLEET ENQUIRY</p><span>All fields marked * are needed</span></div>
    <form class="form" data-form="contact" novalidate>
      <div class="row2">{field("contact-name", "name", "Name *", auto="name")}{field("contact-company", "company", "Company *", auto="organization")}</div>
      <div class="row2">{field("contact-email", "email", "Work e-mail *", "email", auto="email", err="Please enter a work e-mail address.")}{field("contact-fleet", "fleet", "Fleet size", "select", req=False, extra=FLEETS)}</div>
      <fieldset class="field" data-field="types"><legend>Ship types <span class="opt">(choose any)</span></legend><div class="chips">{SHIPCHIPS}</div></fieldset>
      {field("contact-message", "message", "What would you like to talk about? *", "textarea", err="Please write a short message.")}
      <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="enq-foot">{consent("contact")}<button class="btn" type="submit">Send {ARW}</button></div>
      <p class="form-error" role="alert"></p>
    </form>
    {status("contact", "Message ready to send")}
  </div>
</div></section>
""")

# ── Legal and 404 ────────────────────────────────────────────────────────
PARTS = pathlib.Path(__file__).parent / 'partials'
for key, title in [('privacy', 'Privacy notice'), ('cookies', 'Cookie notice'), ('policies', 'Corporate policies')]:
    body = (PARTS / f'legal-{key}.body.html').read_text()
    page(f'legal-{key}', f'{title} · Neural Drift', f'{title} for the Neural Drift website.', f'''
<section class="phero solo" aria-labelledby="{key}-h1"><div class="wrap phero-grid"><div>
  {crumbs(("Home", "/"), (title, None))}<p class="kicker">Legal</p><h1 id="{key}-h1" tabindex="-1">{title}</h1>
</div></div></section>
<section class="sec lt"><div class="wrap"><div class="prose">{body}</div></div></section>
''')

page('404', 'Page not found · Neural Drift', 'This page is not on the site.', f'''
<section class="phero solo" aria-labelledby="nf-h1" style="min-height:60vh"><div class="wrap phero-grid"><div>
  <p class="kicker">404</p><h1 id="nf-h1" tabindex="-1">This page is not on the chart</h1>
  <p class="lead">The address may have changed. Start from the home page or GE6 Engine.</p>
  <div class="btns"><a class="btn" href="/">Home {ARW}</a><a class="btn btn-line" href="/ge6/">GE6 Solutions</a></div>
</div></div></section>
''')
print('pages written:', len(list(OUT.glob('*.html'))))
