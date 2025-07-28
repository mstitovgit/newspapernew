let counter = 0;
const postTemplates = {
  posttextshort: `
 <div class="post post_short post_text">
   <div class="post_info">
     <p class="post_info_text post_info_text_small post_info_time">{{time}}</p>
     <p class="post_info_text post_info_text_small post_info_source">{{source}}</p>
   </div>
 <a href="#{{id}}">  <p class="post_headline truncate-text">{{text}}</p></a>
 </div>
`,
  posttextaccent: `
<div class="post post_short post_text post_accent">
    <div class="post_info">
      <p class="post_info_text post_info_text_small post_info_time">{{time}}</p>
      <p class="post_info_text post_info_text_small post_info_source">{{source}}</p>
    </div>
    <div class="post_letter "><p class="{{fontclass}}">{{letter}}</p></div>
    <a href="#{{id}}"><p class="post_headline truncate-text">{{text}}</p></a>
  </div>`,
  posttextfull: `
<div class="post post_full post_text" id="{{id}}">
    <div class="post_letter"><p class="{{fontclass}}">{{letter}}</p></div>
    <p class="post_headline post_headline_big">{{text}}</p>
    <div class="post_info post_info_big">
     <p class="post_info_text post_info_text_full post_info_text_big">Published at {{time}} by {{source}}</p>
    </div>
  </div>`,
  postimageshort: `
<div class="post post_short post_image">
    <div class="post_info">
      <p class="post_info_text post_info_text_small post_info_time">{{time}}</p>
      <p class="post_info_text post_info_text_small post_info_source">{{source}}</p>
    </div>
   <a href="#{{id}}"> <div class="post_image_container post_image_container-small">
      {{media}}
    </div></a>
  </div>`,
  postimageaccent: `
<div class="post post_short post_image post_accent">
   <a href="#{{id}}"> <div class="post_image_container post_image_container-big">
      {{media}}
    </div></a>
    <div class="post_info">
      <p class="post_info_text post_info_text_small post_info_time">{{time}}</p>
      <p class="post_info_text post_info_text_small post_info_source">{{source}}</p>
    </div>
  </div>`,
  postimagefull: `
 <div class="post post_full post_image" id="{{id}}">
    <div class="post_image_container post_image_container-big">
      {{media}}
    </div>
    <div class="post_info post_info_big">
      <p class="post_info_text post_info_text_full post_info_text_big">Published at {{time}} by {{source}}</p>
    </div>
  </div>`,
  postimagetextaccent: `<div class="post post_short post_imagetext post_accent">
    <div class="post_image_container post_image_container-big">
      {{media}}
    </div>
    <div class="post_info">
      <p class="post_info_text post_info_text_small post_info_time">{{time}}</p>
      <p class="post_info_text post_info_text_small post_info_source">{{source}}</p>
    </div>
   <a href="#{{id}}"> <p class="post_headline truncate-text">{{text}}</p></a>
  </div>`,
  postimagetextfull: `<div class="post post_full post_imagetext" id="{{id}}">
    <div class="post_image_container post_image_container-big">
      {{media}}
    </div>
    <p class="post_headline post_headline_big">{{text}}</p>
    <div class="post_info post_info_big">
      <p class="post_info_text post_info_text_full post_info_text_big">Published at {{time}} by {{source}}</p>
    </div>
  </div>`,
};

const fonts = ["christmas", "druzhok", "lenora", "lighthaus", "playfairDisplay", "romile"];
const nextFont = createCyclicShuffler(fonts);
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const posts = JSON.parse(fs.readFileSync("../parser/posts.json", "utf-8"));

const templatePath = "../newspaper.html";
const outputPath = "../generated/output.html";

const dom = new JSDOM(fs.readFileSync(templatePath, "utf-8"));
const document = dom.window.document;

// === Заполняем верхний хедер ===
const user = "MSTITOV";
const today = new Date()
  .toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  .toUpperCase();

document.querySelector(".header_date").textContent = today;
document.querySelector(".header_newscounter").textContent = `${posts.length} NEWS`;
document.querySelector(".username").textContent = user;

// === Заполняем shortly ===
const categories = [];

const shortlyContainer = document.querySelector(".content");
let shortlyCounter = 0;
let currentCategory = "";
posts.forEach((post) => {
  if (post.category !== currentCategory) {
    currentCategory = post.category;
    categories[post.category] = post.category_name;
    const newCategory = createCategoryEl(post.category, post.category_name);
    shortlyContainer.appendChild(newCategory);
  }
  const el = createShortlyPost(post, shortlyCounter) || "";
  if (el !== "") {
    shortlyContainer.appendChild(el);
    shortlyCounter += 1;
  }
});

// === Заполняем тематические категории ===
let addStyles = "";
for (const key in categories) {
  const category = key;
  const category_name = categories[key];
  const container = document.createElement("div");
  container.classList.add("content", category);
  container.setAttribute("data-page", category);
  document.body.append(container);
  createHeaderForCategory(category, category_name);
  addStyles += createCssForCategory(category);

  posts.forEach((post) => {
    if (post.category === category) {
      const el = createFullPost(post) || "";
      if (el !== "") {
        container.appendChild(el);
      }
    }
  });
}
const style = document.createElement("style");
style.innerHTML = addStyles;
document.head.appendChild(style);

// === Запись итогового HTML ===
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, dom.serialize(), "utf-8");
console.log(`✅ HTML сгенерирован в ${outputPath}`);

// === Генераторы постов ===

function createHeaderForCategory(category, category_name) {
  const headerForCategory = document.createElement("div");
  headerForCategory.classList = `header${category}`;
  headerForCategory.innerHTML = `
<div class="category">${category_name}</div>`;
  document.body.prepend(headerForCategory);
}

function createCssForCategory(category) {
  const css = `
    @page ${category} {
      margin: 170px 40px 90px;
      @top-center {
        content: element(header${category});
      }
    }

    .header${category} {
      position: running(header${category});
    }

    .${category} {
      page: ${category};
    }
  `;
  return css;
}
function createCyclicShuffler(arr) {
  let pool = [...arr];
  let last = null;

  return function next() {
    // Перемешать, если закончились
    if (pool.length === 0) {
      pool = [...arr];
      // Убираем прошлый, чтобы он не повторился
      pool = pool.filter(item => item !== last);
    }

    // Выбираем случайный индекс
    const index = Math.floor(Math.random() * pool.length);
    const item = pool.splice(index, 1)[0];
    last = item;
    return item;
  };
}

function createPostFromTemplate(id, data) {
  data.fontclass = nextFont();
 
  if (data.letter.toUpperCase() === "Д") {
    data.fontclass += " dletter";
  } else if (data.letter.toUpperCase === "Й") {
    data.letter = "И";
  }

  let html = postTemplates[id];
  const add_to_path = "../parser/";

  // если media — массив, собираем HTML
  if (Array.isArray(data.media)) {
    data.media = data.media.map((path) => `<img src="${add_to_path}${path}" class="post_image"> `).join("");
  }

  for (const key in data) {
    html = html.replaceAll(`{{${key}}}`, data[key]);
  }

  const wrapper = document.createElement("template");
  wrapper.innerHTML = html.trim();
  const post = wrapper.content.cloneNode(true);
  return post;
}

function createCategoryEl(category, category_name) {
  const el = document.createElement("div");
  el.classList.add("category");
  el.textContent = category_name;
  return el;
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const mskDate = new Date(date.getTime()); // UTC+3
  return mskDate.toTimeString().slice(0, 5); // "12:34"
}

function extractFirstLetter(text) {
  const match = text?.match(/[a-zA-Zа-яА-Я]/); // первая буква
  return match ? match[0] : "";
}

function createShortlyPost(post, index) {
  let id = "post";
  const hasText = post.text !== "";
  const hasMedia = post.media.length;

  if ((index < 16 &&( index === 4 || index === 8 || index === 12 || index === 15)) || (index >=16 && (index - 15) % 13 === 12)) {
    if (hasMedia && hasText) {
      id += "imagetextaccent";
    } else if (hasMedia && !hasText) {
      id += "imageaccent";
    } else if (hasText) {
      id += "textaccent";
    }
  } else if (hasMedia && !hasText) {
    id += "imageshort";
  } else if (hasText) {
    id += "textshort";
  }

  if (id === "post") {
    return;
  }

  const postElement = createPostFromTemplate(id, {
    time: formatTime(post.date),
    source: post.channel_name,
    text: trimText(post.text) || "",
    media: hasMedia ? post.media : "",
    letter: hasText ? extractFirstLetter(post.text) : "",
    id: post.id,
  });

  return postElement;
}

function createFullPost(post, document) {
  let id = "post";
  const hasText = post.text !== "";
  const hasMedia = post.media.length;

  if (hasMedia && hasText) {
    id += "imagetextfull";
  } else if (hasMedia && !hasText) {
    id += "imagefull";
  } else if (hasText) id += "textfull";

  if (id === "post") {
    return;
  }

  const postElement = createPostFromTemplate(id, {
    time: formatTime(post.date),
    source: post.channel,
    text: post.text || "",
    media: hasMedia ? post.media : "",
    letter: hasText ? extractFirstLetter(post.text) : "",
    id: post.id,
  });

  return postElement;
}

function replaceLinks(text, links = []) {
  if (!links.length) return escapeHtml(text);

  let result = "";
  let current = 0;

  links.sort((a, b) => a.offset - b.offset);

  for (let link of links) {
    result += escapeHtml(text.slice(current, link.offset));
    const linked = escapeHtml(text.slice(link.offset, link.offset + link.length));
    result += `<a href="${link.url}" class="post_link">${linked}</a>`;
    current = link.offset + link.length;
  }

  result += escapeHtml(text.slice(current));
  return result;
}

function escapeHtml(str) {
  return str.replace(
    /[&<>"']/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[tag])
  );
}

function truncate(str, max) {
  return str.length <= max ? str : str.slice(0, max) + "...";
}

function trimText(text, maxLength = 130) {
  if (text.length <= maxLength) return text;

  const trimmed = text.slice(0, maxLength);

  // Ищем последнее вхождение пробела, чтобы не обрезать слово
  const lastSpaceIndex = trimmed.lastIndexOf(" ");
  if (lastSpaceIndex === -1) {
    // Если вообще нет пробелов, просто обрезаем как есть
    return trimmed + "…";
  }

  return trimmed.slice(0, lastSpaceIndex) + "…";
}
