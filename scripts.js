const WHATSAPP_NUMBERS = {
  principal: "5511989488326",
  secundario: "5511913692230",
};

const buildWhatsAppLink = (targetKey, context = "") => {
  const number =
    WHATSAPP_NUMBERS[targetKey] ||
    (targetKey?.startsWith("55") ? targetKey : WHATSAPP_NUMBERS.principal);
  const message = encodeURIComponent(
    `Olá! Gostaria de saber mais sobre ${context || "os serviços"} da Sant’Ana Cargas.`
  );
  return `https://wa.me/${number}?text=${message}`;
};

const setupWhatsAppLinks = () => {
  document.querySelectorAll("[data-whatsapp]").forEach((node) => {
    const serviceContext =
      node.dataset.service || node.closest("[data-service]")?.dataset.service || "";
    const context = serviceContext || node.dataset.whatsapp || node.getAttribute("aria-label") || "";
    node.href = buildWhatsAppLink(node.dataset.whatsapp, context);
  });
};

const setupScrollButtons = () => {
  document.querySelectorAll("[data-scroll]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.dataset.scroll);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
};

const setupMenu = () => {
  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mobileMenu");
  if (!toggle || !menu) return;

  const closeBtn = menu.querySelector(".close-menu");

  const toggleMenu = (forceState) => {
    const willOpen =
      typeof forceState === "boolean" ? forceState : !document.body.classList.contains("menu-open");
    document.body.classList.toggle("menu-open", willOpen);
    toggle.classList.toggle("is-active", willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
    menu.setAttribute("aria-hidden", String(!willOpen));
  };

  toggle.addEventListener("click", () => toggleMenu());
  closeBtn?.addEventListener("click", () => toggleMenu(false));

  menu.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", () => toggleMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleMenu(false);
    }
  });
};

const setupObserver = () => {
  const items = document.querySelectorAll("[data-animate]");
  if (!items.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 }
  );
  items.forEach((item) => observer.observe(item));
};

const setupStackedSections = () => {
  document.querySelectorAll(".stack-card").forEach((section, index) => {
    section.style.setProperty("--stack-index", index + 1);
  });
};

const setupIntro = () => {
  const intro = document.getElementById("intro");
  if (!intro) return;
  window.addEventListener("load", () => {
    setTimeout(() => {
      intro.classList.add("is-hidden");
      document.body.classList.remove("is-loading");
    }, 7000); // Rotas + partículas (2.8s) + logo aparece (1.2s) + tempo visível (3s)
  });
};

const setupHexGridRotation = () => {
  const hexGrid = document.querySelector(".visual-hex-grid");
  if (!hexGrid) return;

  let ticking = false;

  const updateRotation = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    const rotation = scrollY * 0.15; // Ajuste a velocidade de rotação aqui
    hexGrid.style.transform = `rotate(${rotation}deg)`;
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateRotation);
      ticking = true;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
};

const initWebGLScene = () => {
  const canvas = document.getElementById("sceneCanvas");
  if (!canvas) return;

  if (document.body.classList.contains("reduced-motion")) {
    canvas.remove();
    return;
  }

  const gl =
    canvas.getContext("webgl", { alpha: true, antialias: true, preserveDrawingBuffer: false }) ||
    canvas.getContext("experimental-webgl");

  if (!gl) {
    canvas.remove();
    return;
  }

  const vertexShaderSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    uniform vec2 uResolution;
    uniform float uTime;

    void main() {
      vec2 st = gl_FragCoord.xy / uResolution;
      float wave = sin((st.x + st.y + uTime * 0.25) * 8.0) * 0.02;
      float pulse = smoothstep(0.2, 0.8, st.y + wave);
      vec3 base = mix(vec3(0.95, 0.98, 1.0), vec3(0.84, 0.9, 1.0), pulse);
      float accent = smoothstep(0.5, 0.9, st.x + wave + sin(uTime * 0.3) * 0.05);
      vec3 color = base + vec3(1.0, 0.63, 0.32) * accent * 0.18;
      gl_FragColor = vec4(color, 0.55);
    }
  `;

  const compileShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) {
    canvas.remove();
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    canvas.remove();
    return;
  }

  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  const positionLocation = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const resolutionLocation = gl.getUniformLocation(program, "uResolution");
  const timeLocation = gl.getUniformLocation(program, "uTime");

  const resize = () => {
    const { clientWidth, clientHeight } = canvas;
    if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
      canvas.width = clientWidth;
      canvas.height = clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  };

  resize();
  window.addEventListener("resize", resize);

  let start = null;
  const render = (now) => {
    if (!start) start = now;
    const delta = (now - start) / 1000;
    gl.uniform1f(timeLocation, delta);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
};

const setupReducedMotion = () => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (query.matches) {
    document.body.classList.add("reduced-motion");
  }
  query.addEventListener("change", (event) => {
    document.body.classList.toggle("reduced-motion", event.matches);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setupWhatsAppLinks();
  setupScrollButtons();
  setupMenu();
  setupObserver();
  setupStackedSections();
  setupIntro();
  setupReducedMotion();
  initWebGLScene();
  setupHexGridRotation();
});

