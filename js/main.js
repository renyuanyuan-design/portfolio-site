/* ============================================================
   任媛媛 · 求职作品集  main.js
   零依赖原生 JS：导航 / 泡泡 / 灯箱 / 折叠 / 抽卡 / 滚动入场
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 导航：滚动阴影 + 高亮 + 汉堡 ---------- */
  const nav = $('#nav');
  const navLinks = $('#navLinks');
  const burger = $('#navBurger');
  const links = $$('#navLinks a');
  const sections = ['home', 'internship', 'education', 'campus', 'skills', 'contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
    let current = '';
    const probe = window.scrollY + window.innerHeight * 0.35;
    sections.forEach(sec => {
      if (sec.offsetTop <= probe) current = sec.id;
    });
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    burger.classList.toggle('open', open);
  });
  links.forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger.classList.remove('open');
  }));

  /* ---------- Hero 泡泡（14 个） ---------- */
  const bubbleBox = $('#bubbles');
  const BUBBLE_COUNT = 14;
  if (bubbleBox && !reduced) {
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const b = document.createElement('span');
      b.className = 'bubble';
      const size = 18 + Math.random() * 36;          // 18 - 54px
      const dur = 9 + Math.random() * 11;            // 9 - 20s
      const drift = (Math.random() * 2 - 1) * 60;     // -60 - 60px
      b.style.width = b.style.height = size + 'px';
      b.style.left = Math.random() * 100 + '%';
      b.style.animationDuration = dur + 's';
      b.style.animationDelay = (-Math.random() * dur) + 's';
      b.style.setProperty('--drift', drift + 'px');
      bubbleBox.appendChild(b);
    }
  }

  /* 纵轴彩色：分两段绘制——
     【前段】第 1 ~ 第 visibleBefore 个 dot，渐变从前端透明过渡到该段 dot 色、再到下个 dot 色；
     【后段】（如有）从第 visibleBefore+1 个 dot 起，到末端；中部按钮位置不画轴。
     这样后 4 段展开时，前后轴自然分成两段，不强制连续，降低视觉与逻辑复杂度。 */
  function colorTimelineAxis() {
    if (!tlMore) return;
    tlMore.querySelectorAll('.tl-seg').forEach(s => s.remove());
    // 取当前可见的 dot（展开后 5-8 也可见）
    const items = [...tlMore.querySelectorAll('.exp-item')]
      .filter(it => it.offsetParent !== null);
    const dots = items.map(it => it.querySelector('.exp-dot')).filter(Boolean);
    if (!dots.length) return;

    const tlRect = tlMore.getBoundingClientRect();
    const tlTop = tlRect.top;
    const tlH = tlRect.height;
    const centers = dots.map(d => {
      const r = d.getBoundingClientRect();
      return r.top + r.height / 2 - tlTop;
    });

    // 按钮的纵向区间（避免画轴通过按钮）
    const btn = tlMore.querySelector('.more-toggle');
    let btnTop = 0, btnBottom = 0;
    if (btn) {
      const br = btn.getBoundingClientRect();
      btnTop = br.top - tlTop;
      btnBottom = br.bottom - tlTop;
    }

    function mkSeg(top, h, bg, colorKey, glow) {
      if (h <= 2) return;
      const seg = document.createElement('div');
      seg.className = 'tl-seg';
      seg.dataset.color = colorKey;
      seg.style.cssText =
        'top:' + top + 'px;' +
        'height:' + h + 'px;' +
        'background:' + bg + ';' +
        '--seg-glow:' + glow + ';';
      tlMore.appendChild(seg);
    }

    // —— 第一段：timeline 顶端 → 第一个 dot 圆心（淡入到 c1） ——
    if (centers[0] > 4) {
      const fc = DOT_COLORS[dots[0].getAttribute('data-color')] || DOT_COLORS.blue;
      mkSeg(0, centers[0],
        'linear-gradient(180deg, rgba(255,255,255,0) 0%, ' + fc.hex + ' 100%)',
        dots[0].getAttribute('data-color'), fc.glow);
    }

    // —— 中间过渡段：dot[i] 圆心 → dot[i+1] 圆心（按可见的 dot 列表连接） ——
    for (let i = 0; i < dots.length - 1; i++) {
      const c1 = DOT_COLORS[dots[i].getAttribute('data-color')] || DOT_COLORS.blue;
      const c2 = DOT_COLORS[dots[i + 1].getAttribute('data-color')] || DOT_COLORS.blue;
      const start = centers[i];
      const end = centers[i + 1];
      // 若中间穿过按钮区间，从 dot[i] 画到按钮顶 + 留空 + 从按钮底画到 dot[i+1]
      if (btn && end > btnTop && start < btnBottom) {
        if (start < btnTop) {
          mkSeg(start, btnTop - start,
            'linear-gradient(180deg, ' + c1.hex + ' 0%, ' + c2.hex + ' 100%)',
            dots[i].getAttribute('data-color'), c1.glow);
        }
        if (end > btnBottom) {
          const ratio = (btnBottom - start) / (end - start);
          // 在按钮底色处用插值色
          const interpHex = mixHex(c1.hex, c2.hex, Math.min(1, Math.max(0, ratio)));
          mkSeg(btnBottom, end - btnBottom,
            'linear-gradient(180deg, ' + interpHex + ' 0%, ' + c2.hex + ' 100%)',
            dots[i].getAttribute('data-color'), c1.glow);
        }
      } else {
        mkSeg(start, end - start,
          'linear-gradient(180deg, ' + c1.hex + ' 0%, ' + c2.hex + ' 100%)',
          dots[i].getAttribute('data-color'), c1.glow);
      }
    }

    // —— 末段：最后一个 dot 圆心 → timeline 底部（颜色淡出） ——
    const lastDot = dots[dots.length - 1];
    const lc = DOT_COLORS[lastDot.getAttribute('data-color')] || DOT_COLORS.blue;
    const lastStart = centers[centers.length - 1];
    const lastH = tlH - lastStart;
    mkSeg(lastStart, lastH,
      'linear-gradient(180deg, ' + lc.hex + ' 0%, rgba(255,255,255,0) 100%)',
      lastDot.getAttribute('data-color'), lc.glow);
  }

  /* 将 #a3c8ec 渐变到 #9ee0bd 等，t ∈ [0,1] */
  function mixHex(h1, h2, t) {
    const p = s => [parseInt(s.slice(1,3),16), parseInt(s.slice(3,5),16), parseInt(s.slice(5,7),16)];
    const a = p(h1), b = p(h2);
    const m = a.map((v,i) => Math.round(v + (b[i] - v) * t));
    return '#' + m.map(x => x.toString(16).padStart(2,'0')).join('');
  }

  /* ---------- 更多经历折叠 ---------- */
  const moreToggle = $('#moreToggle');
  const tlMore = document.querySelector('#internship .timeline');
  const extrasGroup = $('#extrasGroup');
  const DOT_COLORS = {
    blue:   { hex:'#a3c8ec', glow:'rgba(126,172,221,.45)' },
    green:  { hex:'#9ee0bd', glow:'rgba(108,206,155,.45)' },
    purple: { hex:'#c4a8ec', glow:'rgba(165,133,225,.45)' },
    pink:   { hex:'#f5bcd0', glow:'rgba(232,155,180,.45)' }
  };

  if (moreToggle && tlMore && extrasGroup) {
    const label = moreToggle.querySelector('.more-toggle__label');
    moreToggle.addEventListener('click', () => {
      const open = tlMore.classList.toggle('is-expanded');
      moreToggle.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? '收起更多经历' : '点击展开更多经历';
      if (extrasGroup) extrasGroup.hidden = !open;
      // 展开后滚到按钮，让用户看到收起按钮位置（仍位于 04 与 05 之间）
      if (open) {
        setTimeout(() => {
          moreToggle.scrollIntoView({behavior:'smooth', block:'center'});
        }, 120);
      }
      // 重绘彩色轴
      requestAnimationFrame(() => {
        colorTimelineAxis();
        setTimeout(() => colorTimelineAxis(), 280);
      });
    });
  }

  /* 首屏 & resize 时绘制彩色轴，避免前 4 段与纵轴颜色对不齐 */
  const drawAxis = () => requestAnimationFrame(colorTimelineAxis);
  drawAxis();
  window.addEventListener('load', drawAxis);
  window.addEventListener('resize', drawAxis);
  if (window.ResizeObserver) {
    try {
      const ro = new ResizeObserver(drawAxis);
      if (tlMore) ro.observe(tlMore);
    } catch (e) { /* ignore */ }
  }

  /* ---------- 荣誉卡点击高亮 ---------- */
  $$('.honor').forEach(h => h.addEventListener('click', () => {
    const on = h.classList.toggle('active');
    if (on) $$('.honor').forEach(x => { if (x !== h) x.classList.remove('active'); });
  }));

  /* ---------- 拍立得灯箱 ---------- */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbCap = $('#lbCap');
  const lbCounter = $('#lbCounter');
  let currentGroup = [];
  let currentIdx = 0;

  function showLb() {
    const p = currentGroup[currentIdx];
    const img = p.querySelector('img');
    lbImg.src = img.src;
    lbImg.alt = img.alt || p.dataset.name || '';
    lbCap.textContent = p.dataset.name || '';
    lbCounter.textContent = (currentIdx + 1) + ' / ' + currentGroup.length;
    // —— 灯箱图片跟随缩略图的旋转状态（京东选品 / 百度实习） ——
    lbImg.classList.toggle('is-rotated90', p.classList.contains('is-rotated45'));
  }
  function openLb(group, idx) {
    currentGroup = group;
    currentIdx = idx;
    showLb();
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    // 图片卡弹窗仍开着时不恢复页面滚动
    const campusModalEl = $('#campusModal');
    if (!campusModalEl || !campusModalEl.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }
  function step(d) {
    currentIdx = (currentIdx + d + currentGroup.length) % currentGroup.length;
    showLb();
  }

  $$('.polaroids').forEach(box => {
    const group = $$('.polaroid', box);   // 含隐藏图
    group.forEach((p, i) => p.addEventListener('click', () => openLb(group, i)));
  });
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => step(-1));
  $('#lbNext').addEventListener('click', () => step(1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  /* ---------- 技能 / 兴趣 抽卡 ---------- */
  const SKILLS = [
    { e: '🧪', label: '实验设计', tag: '增长抓手', back: '三因子正交实验、AB 实验，用数据下判断。' },
    { e: '🔍', label: '数据分析', tag: '漏斗拆解', back: '漏斗拆解、人群分层，SQL/Excel/Python 顺手。' },
    { e: '💡', label: '营销方案', tag: 'UGC 玩法', back: '从原型到上线，48 玩法级别的 UGC 活动。' },
    { e: '🎨', label: '原型设计', tag: 'Figma', back: '使用Figma参与百度两段项目，制作弹幕墙/半屏跳转交互原型' },
    { e: '🤖', label: 'AI 工具', tag: '提效落地', back: 'Stitch/Gemini 落地到策划与数据工作流。' },
    { e: '🎙️', label: '直播运营', tag: '数字人', back: '数字人直播从 0 到 2k 日均 GMV。' },
    { e: '🎬', label: '视频剪辑', tag: '宣发物料', back: '宣传片拍摄剪辑，公众号排版 3000+ 曝光。' },
    { e: '📊', label: '深度报告', tag: '行业研究', back: '写过金刚石行业与上市公司深度研报。' }
  ];
  const HOBBIES = [
    { e: '📷', label: '个人技能卡', tag: '定格瞬间', back: '摄影（定格瞬间）、主持（掌控全场）、乒乓球（敏捷反应）、羽毛球（爆发扣杀）。' },
    { e: '🏔️', label: '户外探索卡', tag: '解锁未知', back: '旅游（解锁未知地图）、徒步（用脚步丈量风景）、露营（星空下的夜话）。' },
    { e: '🎉', label: '社交派对卡', tag: '气氛担当', back: '聚会（组织者&气氛担当）、桌游（策略与演技并存）、K 歌（麦霸级选手）。' },
    { e: '🎨', label: '创作记录卡', tag: '记录生活', back: '用镜头写日记、用 vlog 讲故事、用排版做手账——把经历变成作品。' },
    { e: '🏓', label: '竞技燃力卡', tag: '专注释放', back: '乒乓球快攻、羽毛球跳杀、台球精准走位——享受运动中的专注与释放。' },
    { e: '🏙️', label: '城市漫游卡', tag: '街头探索', back: '逛特色咖啡馆、探店小众书店、扫街拍人文——用脚步发现城市褶皱里的惊喜。' },
    { e: '🛋️', label: '松弛时刻卡', tag: '无所事事', back: '窝在沙发看老电影、瘫着刷纪录片、煮一锅热汤配雨天——纯粹享受无所事事。' },
    { e: '🧭', label: 'estj 人格卡', tag: '做自己', back: '工作上未雨绸缪，生活上安排紧凑——做不一样的自己。' }
  ];

  function buildDeck(grid, data) {
    grid.innerHTML = '';
    data.forEach(d => {
      const card = document.createElement('div');
      card.className = 'skill-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', d.label);
      card.innerHTML = `
        <div class="card-inner">
          <div class="card-face card-front">
            <span class="card-icon">✦</span>
            <div class="card-qmark">?</div>
            <div class="card-tap">点击抽卡</div>
            <span class="card-spark">✦</span>
          </div>
          <div class="card-face card-back">
            <div class="card-emoji">${d.e}</div>
            <div class="card-back-title">${d.label}</div>
            <div class="card-tag">${d.tag}</div>
            <p>${d.back}</p>
          </div>
        </div>`;
      const flip = () => {
        card.classList.add('shake');
        setTimeout(() => {
          card.classList.remove('shake');
          card.classList.toggle('flipped');
        }, 450);
      };
      card.addEventListener('click', flip);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
      });
      grid.appendChild(card);
    });
  }

  const skillGrid = $('#skillGrid');
  const hobbyGrid = $('#hobbyGrid');
  buildDeck(skillGrid, SKILLS);
  buildDeck(hobbyGrid, HOBBIES);

  $('#shuffleBtn').addEventListener('click', () => {
    [skillGrid, hobbyGrid].forEach(g => {
      const cards = $$('.skill-card', g);
      // 翻回正面
      cards.forEach(c => c.classList.remove('flipped'));
      // Fisher-Yates 随机重排
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        g.insertBefore(cards[j], cards[i]);
      }
    });
  });

  /* ---------- 鼠标 / 触摸：背景水波扩散 ---------- */
  if (!reduced) {
    // 与统一背景的三块主色焦点一致；波纹取鼠标所在位置的主色
    const COLORS = [
      { c: '#fbe4ec', x: 0.12, y: 0.10 },   // 左上 粉
      { c: '#fdf3d8', x: 0.48, y: 0.42 },   // 中 黄
      { c: '#d9f2e8', x: 0.88, y: 0.90 }    // 右下 薄荷
    ];
    const colorAt = (px, py) => {
      let best = COLORS[1], bd = Infinity;
      COLORS.forEach(p => {
        const d = (p.x - px) ** 2 + (p.y - py) ** 2;
        if (d < bd) { bd = d; best = p; }
      });
      return best.c;
    };
    let last = 0;
    // 鼠标在文字卡(.exp-card--text) 或校园经历卡(.campus-card) 内时不生成波纹，
    // 避免 mix-blend-mode 视觉穿透干扰文字 / 卡片内容
    const isInTextCard = (x, y) => {
      const el = document.elementFromPoint(x, y);
      return !!(el && el.closest && (el.closest('.exp-card--text') || el.closest('.campus-card')));
    };
    const ripple = (x, y, force) => {
      const now = performance.now();
      if (!force && now - last < 90) return;   // 移动节流：沿路径留下一串水波
      if (isInTextCard(x, y)) return;           // 文字卡/校园卡上不绘制波纹
      last = now;
      const r = document.createElement('span');
      r.className = 'wave';
      r.style.left = x + 'px';
      r.style.top = y + 'px';
      r.style.color = colorAt(x / window.innerWidth, y / window.innerHeight);
      document.body.appendChild(r);
      r.addEventListener('animationend', () => r.remove());
    };
    window.addEventListener('mousemove', e => ripple(e.clientX, e.clientY, false), { passive: true });
    window.addEventListener('touchmove', e => {
      const t = e.touches[0]; if (t) ripple(t.clientX, t.clientY, false);
    }, { passive: true });
    window.addEventListener('touchstart', e => {
      const t = e.touches[0]; if (t) ripple(t.clientX, t.clientY, true);
    }, { passive: true });
    window.addEventListener('click', e => ripple(e.clientX, e.clientY, true));
  }

  /* ---------- 滚动入场 ---------- */
  const revealEls = $$('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('in-view'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- 荣誉奖项：3D 环形轮播 ---------- */
  (function () {
    const ring = $('#ring');
    if (!ring) return;
    const cards = $$('.card3d', ring);
    const prevBtn = $('#ringPrev');
    const nextBtn = $('#ringNext');
    const dotsBox = $('#ringDots');
    const stage = ring.parentElement; // ring-stage
    const n = cards.length;
    if (n === 0) return;

    let active = 0;
    let autoTimer = null;
    let paused = false;

    // 经典 cover-flow 风格：每张卡根据 data-pos 由 CSS 自动定位
    // 中央 0 / 左 -1 右 1 / 左 -2 右 2 / 远的 ±3 隐藏
    const render = () => {
      const half = Math.floor(n / 2);
      cards.forEach((c, i) => {
        let pos = (i - active + n) % n;
        if (pos > half) pos = pos - n;            // 左侧为负
        c.dataset.pos = pos;
        c.style.setProperty('--rx', '0deg');
        c.style.setProperty('--ry', '0deg');
      });
      if (dotsBox) {
        $$('li', dotsBox).forEach((d, i) => {
          d.classList.toggle('active', i === active);
        });
      }
    };

    const go = (delta) => {
      active = (active + delta + n) % n;
      render();
    };

    const startAuto = () => {
      if (reduced) return;
      stopAuto();
      autoTimer = setInterval(() => { if (!paused) go(1); }, 4200);
    };
    const stopAuto = () => {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    };

    // dots
    if (dotsBox) {
      dotsBox.innerHTML = cards.map(() => '<li></li>').join('');
      dotsBox.addEventListener('click', e => {
        const li = e.target.closest('li');
        if (!li) return;
        const idx = [...dotsBox.children].indexOf(li);
        if (idx >= 0) { active = idx; render(); startAuto(); }
      });
    }
    if (prevBtn) prevBtn.addEventListener('click', e => { e.stopPropagation(); go(-1); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', e => { e.stopPropagation(); go(1);  startAuto(); });

    // 点击中央卡：next；点击两侧卡：跳到那张
    cards.forEach((c, i) => {
      c.addEventListener('click', e => {
        e.stopPropagation();
        const cur = parseInt(c.dataset.pos || 0, 10);
        if (cur === 0) go(1);
        else { active = i; render(); startAuto(); }
      });
    });

    // 点击舞台左右空白：左半=prev, 右半=next（响应式补充）
    if (stage) {
      stage.addEventListener('click', e => {
        if (e.target.closest('.card3d') || e.target.closest('.ring__btn') || e.target.closest('.ring__dots')) return;
        const rect = stage.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 2) { go(-1); startAuto(); }
        else { go(1); startAuto(); }
      });
    }

    // hover 暂停
    if (stage) {
      stage.addEventListener('mouseenter', () => { paused = true; });
      stage.addEventListener('mouseleave', () => { paused = false; });
    }

    // 键盘左右：当滚到该模块附近时
    document.addEventListener('keydown', e => {
      const r = ring.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.top < vh && r.bottom > 0) {
        if (e.key === 'ArrowLeft') { go(-1); startAuto(); }
        if (e.key === 'ArrowRight') { go(1); startAuto(); }
      }
    });

    // hover 3D 倾斜微动（仅中央主卡，克制 ±10°）
    cards.forEach((c) => {
      c.addEventListener('mousemove', (e) => {
        if (c.dataset.pos !== '0') return;
        const r = c.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        c.style.setProperty('--ry', (px * 10).toFixed(2) + 'deg');
        c.style.setProperty('--rx', (-py * 8).toFixed(2) + 'deg');
      });
      c.addEventListener('mouseleave', () => {
        c.style.setProperty('--rx', '0deg');
        c.style.setProperty('--ry', '0deg');
      });
    });

    // 鼠标 / 触摸拖拽滑动轮播（pointer 统一）
    if (stage) {
      let down = false, startX = 0, moved = 0;
      const onDown = (e) => {
        down = true; moved = 0; startX = e.clientX;
        stage.classList.add('is-dragging');
        stopAuto();
      };
      const onMove = (e) => {
        if (!down) return;
        moved = e.clientX - startX;
        // 拖拽中取消 tilt 微动，避免抖动
        cards.forEach(c => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
      };
      const onUp = () => {
        if (!down) return;
        down = false;
        stage.classList.remove('is-dragging');
        if (Math.abs(moved) > 60) { moved < 0 ? go(1) : go(-1); }
        startAuto();
      };
      stage.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      // 拖拽距离过大时，吞掉松手前的卡片 click，避免误切
      cards.forEach(c => c.addEventListener('click', (ev) => {
        if (Math.abs(moved) > 12) { ev.stopPropagation(); ev.preventDefault(); }
      }, true));
    }

    render();
    startAuto();
  })();

  /* ---------- 实习经历：hover 卡片/图片时点亮对应编号按钮 ---------- */
  const dotItems = $$('.exp-item');
  dotItems.forEach(item => {
    const dot = $('.exp-dot', item);
    if (!dot) return;
    const cards = $$('.exp-card', item);
    const enter = () => dot.classList.add('is-active');
    const leave = () => dot.classList.remove('is-active');
    cards.forEach(c => {
      c.addEventListener('mouseenter', enter);
      c.addEventListener('mouseleave', leave);
    });
    // 离开整个区块时也清掉
    item.addEventListener('mouseleave', leave);
  });

  /* ---------- 校园卡：右下角「点击查看」按钮（无图时轻提示） ---------- */
  function showCampusToast(msg) {
    let t = document.getElementById('cvToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'cvToast';
      Object.assign(t.style, {
        position: 'fixed',
        left: '50%',
        top: '32px',
        transform: 'translate(-50%, -12px)',
        background: 'linear-gradient(135deg, #ff7eac 0%, #a777e8 100%)',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '22px',
        fontSize: '.92rem',
        fontWeight: '800',
        boxShadow: '0 10px 28px rgba(184,108,156,.45)',
        opacity: '0',
        transition: 'opacity .25s ease, transform .25s ease',
        zIndex: '9999',
        pointerEvents: 'none',
        letterSpacing: '.03em'
      });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => {
      t.style.opacity = '1';
      t.style.transform = 'translate(-50%, 0)';
    });
    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translate(-50%, -12px)';
    }, 1800);
  }
  /* ---------- 校园经历 · 图片卡弹窗（点击「立即查看」→ 跳出图片卡 → 点图进灯箱） ---------- */
  // 每个校园经历对应的图片卡数据：按真实图片数量（1/2/3 张）渲染，无预留位
  // empty:true 表示该段暂无照片，点击只给轻提示
  const CAMPUS_GALLERY = {
    innovation_proposal: {
      title: '中国国际大学生创新大赛（2025）',
      sub: '省赛金奖 · 核心队员',
      imgs: [
        { src: 'assets/campus/innovation_ppt.png', name: '项目 PPT' },
        { src: 'assets/campus/innovation_plan.png', name: '项目方案书' }
      ]
    },
    market_survey: {
      title: '全国大学生市场调查与分析大赛',
      sub: '全国三等奖 · 核心队员',
      imgs: [
        { src: 'assets/campus/survey_ppt.png', name: '项目 PPT' },
        { src: 'assets/campus/survey_plan.png', name: '项目方案书' },
        { src: 'assets/campus/survey_cert.png', name: '获奖证书' }
      ]
    },
    biz_brand: {
      title: '全国高校商业精英挑战赛 · 品牌策划',
      sub: '全国一等奖',
      imgs: [
        { src: 'assets/campus/brand_cert.png', name: '竞赛证书' },
        { src: 'assets/campus/brand_ppt.png', name: '项目 PPT' },
        { src: 'assets/campus/brand_plan.png', name: '项目方案书' }
      ]
    },
    biz_crossborder: {
      title: '全国高校商业精英挑战赛 · 跨境电商',
      sub: '全国一等奖',
      imgs: [
        { src: 'assets/campus/cross_cert.png', name: '竞赛证书' },
        { src: 'assets/campus/cross_plan.png', name: '项目方案书' }
      ]
    },
    biz_entrepreneur: {
      title: '全国高校商业精英挑战赛 · 创业模拟',
      sub: '全国二等奖',
      imgs: [
        { src: 'assets/campus/entrep_result.png', name: '竞赛成果' },
        { src: 'assets/campus/entrep_cert.jpg', name: '竞赛证书' }
      ]
    },
    class_secretary: {
      title: '班级团支书',
      sub: '组织策划百人大型团日活动',
      imgs: [
        { src: 'assets/campus/sec_best.jpg', name: '校最美团支书' },
        { src: 'assets/campus/sec_activity.png', name: '班级活动' },
        { src: 'assets/campus/sec_build.png', name: '组织建设' }
      ]
    },
    student_union: {
      title: '学生会团务主席',
      sub: '组织大型团建覆盖 3000+ 青年团员',
      imgs: [
        { src: 'assets/campus/union_plan.png', name: '组织策划' }
      ]
    },
    new_media: {
      title: '网络新媒体干事',
      sub: '设计海报 / 剪辑宣传片 / 公众号排版',
      imgs: [
        { src: 'assets/campus/new_media.png', name: '海报与排版作品' }
      ]
    },
    cfcc: {
      title: 'CFCC 智慧经济研究中心',
      sub: '研究助理 · 斯坦福大学研修',
      imgs: [
        { src: 'assets/campus/cfcc_center.png', name: '研究中心' }
      ]
    }
  };

  const campusModal = $('#campusModal');
  const campusModalTitle = $('#campusModalTitle');
  const campusModalSub = $('#campusModalSub');
  const campusModalHint = $('#campusModalHint');
  const campusPolaroids = $('#campusPolaroids');
  const campusModalClose = $('#campusModalClose');

  function buildCampusPolaroids(key) {
    const g = CAMPUS_GALLERY[key];
    if (!g) return 0;
    campusPolaroids.innerHTML = '';
    const reals = [];
    (g.imgs || []).forEach(item => {
      const fig = document.createElement('figure');
      fig.className = 'polaroid';
      fig.dataset.name = item.name;
      fig.innerHTML =
        '<img src="' + item.src + '" alt="' + item.name + '" loading="lazy" />' +
        '<figcaption>' + item.name + '</figcaption>';
      reals.push(fig);
      campusPolaroids.appendChild(fig);
    });
    // 把当前图片张数写到 CSS 变量上 → grid 列数自适应（1 / 2 / 3 张均居中）
    campusPolaroids.style.setProperty('--pcount', String(reals.length));
    // 真实图可点 → 进灯箱
    reals.forEach((fig, i) => {
      fig.addEventListener('click', () => openLb(reals, i));
    });
    return reals.length;
  }

  function openCampusModal(key) {
    const g = CAMPUS_GALLERY[key];
    if (!g) return;
    campusModalTitle.textContent = g.title;
    campusModalSub.textContent = g.sub || '';
    // 暂无照片：只给轻提示，不弹空白弹窗
    if (g.empty || !g.imgs || !g.imgs.length) {
      showCampusToast('「' + g.title + '」图片待补充');
      return;
    }
    const n = buildCampusPolaroids(key);
    campusModalHint.textContent = g.title + ' · 点击照片查看（共 ' + n + ' 张）';
    campusModal.classList.add('open');
    campusModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeCampusModal() {
    campusModal.classList.remove('open');
    campusModal.setAttribute('aria-hidden', 'true');
    // 灯箱仍开着时不恢复滚动
    if (!lb.classList.contains('open')) document.body.style.overflow = '';
  }

  $$('.campus-view').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const key = btn.dataset.key;
      if (key && CAMPUS_GALLERY[key]) {
        openCampusModal(key);
      } else {
        showCampusToast('图片准备中');
      }
    });
  });
  if (campusModalClose) campusModalClose.addEventListener('click', closeCampusModal);
  campusModal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeCampusModal));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && campusModal.classList.contains('open') && !lb.classList.contains('open')) {
      closeCampusModal();
    }
  });

  /* ---------- 校园卡：点击文字卡 → 对应纵轴小圆极光点亮（与实习经历同款） ---------- */
  $$('.campus-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.campus-view')) return;  // 「点击查看」按钮点击时不触发极光
      $$('.campus-card.is-aurora').forEach(c => { if (c !== card) c.classList.remove('is-aurora'); });
      card.classList.toggle('is-aurora');
    });
  });
  // 点击非校园卡区域 → 全部熄灭
  document.addEventListener('click', e => {
    if (!e.target.closest('.campus-card')) {
      $$('.campus-card.is-aurora').forEach(c => c.classList.remove('is-aurora'));
    }
  });

  /* ---------- 校园纵轴小圆：按其所在纵轴位置取色（粉→薄荷蓝绿对齐轴线） ---------- */
  function axisTint(t){
    // 纵轴渐变：主题粉(#f5bcd0,0%) → 过渡(#cfe3da,50%) → 薄荷蓝绿(#9fd8c8,100%)
    const pink=[245,188,208], mid=[207,227,218], end=[159,216,200];
    let c;
    if(t<=0.5){ const k=t/0.5; c=pink.map((w,i)=>Math.round(w+(mid[i]-w)*k)); }
    else { const k=(t-0.5)/0.5; c=mid.map((m,i)=>Math.round(m+(end[i]-m)*k)); }
    return c;
  }
  function paintCampusDots(){
    $$('.campus-card').forEach(card=>{
      const list=card.closest('.campus-list');
      if(!list) return;
      const lr=list.getBoundingClientRect();
      const cr=card.getBoundingClientRect();
      if(lr.height<=0) return;
      // 圆点中心相对列表顶部：卡片偏移 + 圆点 top(18) + 半径(7) ≈ +25
      const t=Math.min(1, Math.max(0, (cr.top-lr.top+25)/lr.height));
      const [r,g,b]=axisTint(t);
      card.style.setProperty('--dot-solid', `rgb(${r},${g},${b})`);
      card.style.setProperty('--dot-glow', `rgba(${r},${g},${b},.42)`);
      card.style.setProperty('--dot-glow2', `rgba(${r},${g},${b},.22)`);
    });
  }
  paintCampusDots();
  window.addEventListener('load', paintCampusDots);
  window.addEventListener('resize', paintCampusDots);

  // 极光点亮：点击单张文字卡/图片卡 → 仅点亮对应小圆（文字卡与图片卡分开）
  $$('.exp-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('.exp-card.is-aurora').forEach(c => { if (c !== card) c.classList.remove('is-aurora'); });
      card.classList.toggle('is-aurora');
    });
  });
  // 点击非卡片区域 → 全部熄灭
  document.addEventListener('click', e => {
    if (!e.target.closest('.exp-card')) {
      $$('.exp-card.is-aurora').forEach(c => c.classList.remove('is-aurora'));
    }
  });

  /* ---------- 联系我 · 复制邮箱/电话按钮 ---------- */
  function flashCopy(btn, text) {
    if (!btn) return;
    const label = btn.querySelector('span:last-child') || btn;
    const orig = btn.dataset.origLabel || label.textContent;
    btn.dataset.origLabel = orig;
    label.textContent = text;
    btn.classList.add('is-copied');
    setTimeout(() => {
      label.textContent = orig;
      btn.classList.remove('is-copied');
    }, 1500);
  }
  function doCopy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); resolve(); }
      catch (e) { reject(e); }
      finally { document.body.removeChild(ta); }
    });
  }
  const copyEmailBtn = $('#copyEmailBtn');
  const copyPhoneBtn = $('#copyPhoneBtn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      const v = copyEmailBtn.dataset.copy || '';
      doCopy(v).then(() => flashCopy(copyEmailBtn, '已复制 ✓'))
               .catch(() => flashCopy(copyEmailBtn, '复制失败'));
    });
  }
  if (copyPhoneBtn) {
    copyPhoneBtn.addEventListener('click', () => {
      const v = copyPhoneBtn.dataset.copy || '';
      doCopy(v).then(() => flashCopy(copyPhoneBtn, '已复制 ✓'))
               .catch(() => flashCopy(copyPhoneBtn, '复制失败'));
    });
  }
  /* 简历按钮：新标签页预览；若 PDF 不存在，拦截打开并提示 */
  const resumeBtn = $('#resumeBtn');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', e => {
      const rel = resumeBtn.getAttribute('href');
      if (!rel) return;
      // 拼成绝对地址，确保 fetch 可解析
      const url = new URL(rel, location.href).href;
      // 先探测 PDF 是否就绪；不存在则拦截默认打开并提示
      fetch(url, { method: 'HEAD' }).then(r => {
        if (!r.ok) {
          e.preventDefault();
          flashCopy(resumeBtn, '简历准备中');
        }
      }).catch(() => { /* 忽略网络错误，让浏览器按默认行为打开预览 */ });
    });
  }

})();
