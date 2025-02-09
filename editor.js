/* editor.js */

// --- Custom Markdown Parser Functions ---

/**
 * processCustomMarkdown:
 * Processes custom underlining syntax.
 * Syntax:
 *   ~1[text] → underlined in blue (#6D9DC5)
 *   ~2[text] → underlined in orange (#F2C078)
 *   ~3[text] → underlined in brown (#C84C09)
 */
function processCustomMarkdown(text) {
  text = text.replace(/~1\[(.+?)\]/g, '<span style="text-decoration: underline; text-decoration-color: #6D9DC5;">$1</span>');
  text = text.replace(/~2\[(.+?)\]/g, '<span style="text-decoration: underline; text-decoration-color: #F2C078;">$1</span>');
  text = text.replace(/~3\[(.+?)\]/g, '<span style="text-decoration: underline; text-decoration-color: #C84C09;">$1</span>');
  return text;
}

/**
 * customMarkdownParser:
 * A basic Markdown parser that supports:
 *   - Bold: **text**
 *   - Italic: *text*
 *   - Inline code: `code`
 *   - Links: [text](url)
 *   - Paragraphs: Splits text on blank lines and wraps each block in <p>
 * It applies custom underlining first.
 */
function customMarkdownParser(text) {
  text = processCustomMarkdown(text);
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/`(.+?)`/g, '<code>$1</code>');
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  let paragraphs = text.split(/\n\s*\n/).map(p => `<p>${p}</p>`);
  return paragraphs.join('');
}

/**
 * autoColorVerseNumbers:
 * Wraps one- or two-digit numbers (with optional punctuation)
 * in a span styled with color #6D9DC5.
 */
function autoColorVerseNumbers(text) {
  return text.replace(/(\b\d{1,2}\b)([.,:;]?)/g, function(match, number, punctuation) {
    return `<span style="color: #6D9DC5;">${number}</span>${punctuation}`;
  });
}

/**
 * processVerseCubeText:
 * Processes custom verse cube markdown syntax.
 * Text wrapped in :[ and ]: is rendered in italic and at a smaller font.
 */
function processVerseCubeText(text) {
  return text.replace(/:\[(.+?)\]:/g, '<em style="font-size: 0.8em;">$1</em>');
}

// --- Function to Create a Study Note for Preview (used in the editor preview) ---
function createStudyNote(study) {
  const noteDiv = document.createElement('div');
  noteDiv.classList.add('study-note');
  noteDiv.setAttribute('data-study-number', study.studyNumber);

  const titleElem = document.createElement('h2');
  titleElem.classList.add('study-title');
  titleElem.textContent = study.title;
  noteDiv.appendChild(titleElem);

  const descElem = document.createElement('p');
  descElem.classList.add('study-description');
  descElem.textContent = study.description;
  noteDiv.appendChild(descElem);

  const fullStudyDiv = document.createElement('div');
  fullStudyDiv.classList.add('full-study');
  
  study.sections.forEach(section => {
    let sectionElem;
    if (section.type === 'paragraph') {
      sectionElem = document.createElement('div');
      sectionElem.classList.add('paragraph');
      sectionElem.innerHTML = customMarkdownParser(section.content);
    } else if (section.type === 'quote') {
      sectionElem = document.createElement('div');
      sectionElem.classList.add('quote');
      const translations = ["niv", "esv", "nkjv", "kjv", "csb", "nasb", "ceb"];
      translations.forEach(trans => {
        let quoteVersion = document.createElement('div');
        quoteVersion.classList.add('bible-quote', trans);
        if (trans === "niv") {
          quoteVersion.classList.add('active');
        }
        let quoteText = section.quotes[trans] || "";
        if (section.autoColor) {
          quoteText = autoColorVerseNumbers(quoteText);
        }
        let quoteHtml = `<q>${quoteText}</q>`;
        if (section.reference) {
          quoteHtml += ` <em><strong>${section.reference}</strong></em>`;
        }
        if (section.chapter) {
          quoteHtml = `<span>${section.chapter}</span><br>` + quoteHtml;
        }
        quoteVersion.innerHTML = quoteHtml;
        sectionElem.appendChild(quoteVersion);
      });
    } else if (section.type === 'link') {
      sectionElem = document.createElement('div');
      sectionElem.classList.add('link');
      sectionElem.innerHTML = `<a href="${section.content.url}" target="_blank" style="color: #ffbd2e9c; text-decoration: none;">${section.content.text}</a>`;
    } else if (section.type === 'subheading') {
      sectionElem = document.createElement('h3');
      sectionElem.classList.add('subheading');
      sectionElem.textContent = section.content;
    }
    if (sectionElem) {
      fullStudyDiv.appendChild(sectionElem);
    }
  });
  noteDiv.appendChild(fullStudyDiv);

  noteDiv.addEventListener('click', function() {
    this.classList.toggle('extended');
  });
  return noteDiv;
}

// --- Dynamic Section Creation for the Editor ---
function createSectionElement() {
  const sectionDiv = document.createElement('div');
  sectionDiv.classList.add('section');
  
  const headerDiv = document.createElement('div');
  headerDiv.classList.add('section-header');
  
  const typeSelect = document.createElement('select');
  typeSelect.classList.add('section-type');
  const types = [
    { value: "paragraph", text: "Paragraph" },
    { value: "quote", text: "Quote" },
    { value: "link", text: "Link" },
    { value: "subheading", text: "Subheading" }
  ];
  types.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.text;
    typeSelect.appendChild(option);
  });
  headerDiv.appendChild(typeSelect);
  
  const removeBtn = document.createElement('button');
  removeBtn.type = "button";
  removeBtn.textContent = "Remove Section";
  removeBtn.addEventListener('click', function() {
    sectionDiv.remove();
    updatePreview();
  });
  headerDiv.appendChild(removeBtn);
  
  sectionDiv.appendChild(headerDiv);
  
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('section-content');
  sectionDiv.appendChild(contentDiv);
  
  function renderInputs(type) {
    contentDiv.innerHTML = "";
    if (type === "paragraph") {
      const label = document.createElement('label');
      label.textContent = "Paragraph Content:";
      contentDiv.appendChild(label);
      const textarea = document.createElement('textarea');
      textarea.classList.add('section-content-input');
      contentDiv.appendChild(textarea);
    } else if (type === "quote") {
      const translations = ["niv", "esv", "nkjv", "kjv", "csb", "nasb", "ceb"];
      translations.forEach(trans => {
        const label = document.createElement('label');
        label.textContent = `Quote (${trans.toUpperCase()}):`;
        contentDiv.appendChild(label);
        const textarea = document.createElement('textarea');
        textarea.classList.add('quote-' + trans);
        contentDiv.appendChild(textarea);
      });
      const refLabel = document.createElement('label');
      refLabel.textContent = "Reference:";
      contentDiv.appendChild(refLabel);
      const refInput = document.createElement('input');
      refInput.type = "text";
      refInput.classList.add('quote-reference');
      contentDiv.appendChild(refInput);
      
      const chapLabel = document.createElement('label');
      chapLabel.textContent = "Chapter (optional):";
      contentDiv.appendChild(chapLabel);
      const chapInput = document.createElement('input');
      chapInput.type = "text";
      chapInput.classList.add('quote-chapter');
      contentDiv.appendChild(chapInput);
      
      const autoColorLabel = document.createElement('label');
      autoColorLabel.textContent = "Auto Color Verse Numbers:";
      contentDiv.appendChild(autoColorLabel);
      const autoColorCheckbox = document.createElement('input');
      autoColorCheckbox.type = "checkbox";
      autoColorCheckbox.classList.add('auto-color');
      contentDiv.appendChild(autoColorCheckbox);
    } else if (type === "link") {
      const textLabel = document.createElement('label');
      textLabel.textContent = "Link Text:";
      contentDiv.appendChild(textLabel);
      const textInput = document.createElement('input');
      textInput.type = "text";
      textInput.classList.add('link-text');
      contentDiv.appendChild(textInput);
      
      const urlLabel = document.createElement('label');
      urlLabel.textContent = "Link URL:";
      contentDiv.appendChild(urlLabel);
      const urlInput = document.createElement('input');
      urlInput.type = "text";
      urlInput.classList.add('link-url');
      contentDiv.appendChild(urlInput);
    } else if (type === "subheading") {
      const label = document.createElement('label');
      label.textContent = "Subheading Text:";
      contentDiv.appendChild(label);
      const input = document.createElement('input');
      input.type = "text";
      input.classList.add('subheading-text');
      contentDiv.appendChild(input);
    }
  }
  
  renderInputs(typeSelect.value);
  typeSelect.addEventListener('change', function() {
    renderInputs(this.value);
  });
  
  return sectionDiv;
}

// --- Editor Main Code ---
document.addEventListener('DOMContentLoaded', function() {
  const sectionsContainer = document.getElementById('sections-container');
  const addSectionBtn = document.getElementById('add-section-btn');
  const outputPre = document.getElementById('output');
  const previewPane = document.getElementById('preview-pane');
  
  addSectionBtn.addEventListener('click', function() {
    const sectionElem = createSectionElement();
    sectionsContainer.appendChild(sectionElem);
    updatePreview();
  });
  
  function generateStudyJSON() {
    const study = {};
    study.studyNumber = document.getElementById('study-number').value;
    study.recommended = document.getElementById('study-recommended').checked;
    study.title = document.getElementById('study-title').value;
    study.description = document.getElementById('study-description').value;
    study.sections = [];
    
    const sectionElems = document.querySelectorAll('#sections-container .section');
    sectionElems.forEach(sectionElem => {
      const type = sectionElem.querySelector('.section-type').value;
      const sectionObj = { type: type };
      const contentDiv = sectionElem.querySelector('.section-content');
      
      if (type === "paragraph") {
        sectionObj.content = contentDiv.querySelector('textarea').value;
      } else if (type === "quote") {
        sectionObj.quotes = {};
        const translations = ["niv", "esv", "nkjv", "kjv", "csb", "nasb", "ceb"];
        translations.forEach(trans => {
          const textarea = contentDiv.querySelector('.quote-' + trans);
          sectionObj.quotes[trans] = textarea ? textarea.value : "";
        });
        sectionObj.reference = contentDiv.querySelector('.quote-reference').value;
        sectionObj.chapter = contentDiv.querySelector('.quote-chapter').value;
        sectionObj.autoColor = contentDiv.querySelector('.auto-color').checked;
      } else if (type === "link") {
        sectionObj.content = {};
        sectionObj.content.text = contentDiv.querySelector('.link-text').value;
        sectionObj.content.url = contentDiv.querySelector('.link-url').value;
      } else if (type === "subheading") {
        sectionObj.content = contentDiv.querySelector('.subheading-text').value;
      }
      study.sections.push(sectionObj);
    });
    
    return study;
  }
  
  function updatePreview() {
    const study = generateStudyJSON();
    const previewElement = createStudyNote(study);
    previewPane.innerHTML = "";
    previewPane.appendChild(previewElement);
    outputPre.textContent = JSON.stringify([study], null, 2);
  }
  
  document.getElementById('study-form').addEventListener('input', updatePreview);
  document.getElementById('generate-btn').addEventListener('click', updatePreview);
  
  document.getElementById('copy-btn').addEventListener('click', function() {
    const jsonText = outputPre.textContent;
    navigator.clipboard.writeText(jsonText).then(function() {
      alert('JSON copied to clipboard!');
    }, function(err) {
      alert('Error copying JSON: ' + err);
    });
  });
});

// --- Le's Studies Main Code ---

document.addEventListener('DOMContentLoaded', function() {

  function createStudyNote(study) {
    const noteDiv = document.createElement('div');
    noteDiv.classList.add('study-note');
    noteDiv.setAttribute('data-study-number', study.studyNumber);
  
    const titleElem = document.createElement('h2');
    titleElem.classList.add('study-title');
    titleElem.textContent = study.title;
    noteDiv.appendChild(titleElem);
  
    const descElem = document.createElement('p');
    descElem.classList.add('study-description');
    descElem.textContent = study.description;
    noteDiv.appendChild(descElem);
  
    const fullStudyDiv = document.createElement('div');
    fullStudyDiv.classList.add('full-study');
  
    study.sections.forEach(section => {
      let sectionElem;
      if (section.type === 'paragraph') {
        sectionElem = document.createElement('div');
        sectionElem.classList.add('paragraph');
        let contentHtml = customMarkdownParser(section.content);
        sectionElem.innerHTML = contentHtml;
      } else if (section.type === 'quote') {
        sectionElem = document.createElement('div');
        sectionElem.classList.add('quote');
        const translations = ["niv", "esv", "nkjv", "kjv", "csb", "nasb", "ceb"];
        translations.forEach(trans => {
          let quoteVersion = document.createElement('div');
          quoteVersion.classList.add('bible-quote', trans);
          if (trans === "niv") {
            quoteVersion.classList.add('active');
          }
          let quoteText = section.quotes[trans] || "";
          if (section.autoColor) {
            quoteText = autoColorVerseNumbers(quoteText);
          }
          let quoteHtml = `<q>${quoteText}</q>`;
          if (section.reference) {
            quoteHtml += ` <em><strong>${section.reference}</strong></em>`;
          }
          if (section.chapter) {
            quoteHtml = `<span>${section.chapter}</span><br>` + quoteHtml;
          }
          quoteVersion.innerHTML = quoteHtml;
          sectionElem.appendChild(quoteVersion);
        });
      } else if (section.type === 'link') {
        sectionElem = document.createElement('div');
        sectionElem.classList.add('link');
        sectionElem.innerHTML = `<a href="${section.content.url}" target="_blank" style="color: #ffbd2e9c; text-decoration: none;">${section.content.text}</a>`;
      } else if (section.type === 'subheading') {
        sectionElem = document.createElement('h3');
        sectionElem.classList.add('subheading');
        sectionElem.textContent = section.content;
      }
      if (sectionElem) {
        fullStudyDiv.appendChild(sectionElem);
      }
    });
    noteDiv.appendChild(fullStudyDiv);
  
    noteDiv.addEventListener('click', function() {
      this.classList.toggle('extended');
    });
    return noteDiv;
  }
  
  function loadStudies() {
    fetch('studies.json')
      .then(response => response.json())
      .then(data => {
        if (!Array.isArray(data)) {
          console.error('studies.json is not an array!');
          return;
        }
        data.sort((a, b) => Number(a.studyNumber) - Number(b.studyNumber));
        const recommendedContainer = document.getElementById('recommended-container');
        const studyContainer = document.getElementById('study-container');
        recommendedContainer.innerHTML = '';
        studyContainer.innerHTML = '';
        data.forEach(study => {
          if (study.recommended === "true") {
            study.recommended = true;
          }
          const noteElemAll = createStudyNote(study);
          studyContainer.appendChild(noteElemAll);
          if (study.recommended === true) {
            const noteElemRec = createStudyNote(study);
            recommendedContainer.appendChild(noteElemRec);
          }
        });
      })
      .catch(error => {
        console.error('Error loading studies JSON:', error);
      });
  }
  loadStudies();
  
  document.getElementById('search-bar').addEventListener('input', function() {
    const query = this.value.toLowerCase();
    const notes = document.querySelectorAll('.study-note');
    let matchCount = 0;
    notes.forEach(note => {
      let title = note.querySelector('.study-title').textContent.toLowerCase();
      let desc = note.querySelector('.study-description').textContent.toLowerCase();
      if (title.includes(query) || desc.includes(query) || query === '') {
        note.style.display = '';
        matchCount++;
      } else {
        note.style.display = 'none';
      }
    });
    if (query === '') {
      document.getElementById('recommended-studies-subheader').style.display = 'block';
      document.getElementById('search-results-subheader').style.display = 'none';
      document.getElementById('verse-cubes-subheader').style.display = 'block';
      document.getElementById('all-studies-subheader').style.display = 'block';
      document.getElementById('verse-cubes').style.display = 'grid';
    } else {
      document.getElementById('recommended-studies-subheader').style.display = 'none';
      document.getElementById('search-results-subheader').style.display = 'block';
      document.getElementById('verse-cubes-subheader').style.display = 'none';
      document.getElementById('all-studies-subheader').style.display = 'none';
      document.getElementById('verse-cubes').style.display = 'none';
      if (matchCount === 0) {
        document.getElementById('search-results-subheader').querySelector('h2').textContent =
          "Uh oh we haven't studied " + this.value + " yet...";
      } else {
        document.getElementById('search-results-subheader').querySelector('h2').textContent = "Search results:";
      }
    }
  });
  
  document.querySelectorAll('.verse-cube').forEach(cube => {
    cube.addEventListener('click', function() {
      const subject = this.getAttribute('data-subject');
      fetch(`data/${subject}.json`)
        .then(response => response.json())
        .then(data => {
          const randomIndex = Math.floor(Math.random() * data.quotes.length);
          let randomQuote = data.quotes[randomIndex];
          randomQuote = processVerseCubeText(randomQuote);
          document.getElementById('modal-quote').innerHTML = randomQuote;
          document.getElementById('verse-modal').classList.add('show');
        })
        .catch(error => {
          console.error('Error fetching JSON for subject:', subject, error);
        });
    });
  });
  
  document.querySelector('.modal-close').addEventListener('click', function() {
    document.getElementById('verse-modal').classList.remove('show');
  });
  
  window.addEventListener('click', function(event) {
    let modal = document.getElementById('verse-modal');
    if (event.target === modal) {
      modal.classList.remove('show');
    }
  });
  
  (function() {
    const currentTranslationEl = document.getElementById('current-translation');
    const translationScrollbar = document.getElementById('translation-scrollbar');
    const translationOptions = document.querySelectorAll('.translation-option');
    
    currentTranslationEl.addEventListener('click', function(e) {
      e.stopPropagation();
      currentTranslationEl.style.display = 'none';
      translationScrollbar.style.display = 'flex';
      translationOptions.forEach(function(option) {
        if (option.getAttribute('data-translation') === currentTranslationEl.textContent.trim()) {
          option.style.display = 'none';
        } else {
          option.style.display = 'inline-block';
        }
      });
    });
    
    translationOptions.forEach(function(option) {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        const newTranslation = this.getAttribute('data-translation');
        currentTranslationEl.textContent = newTranslation;
        translationScrollbar.style.display = 'none';
        currentTranslationEl.style.display = 'block';
        updateBibleTranslation(newTranslation);
        localStorage.setItem('selectedTranslation', newTranslation);
      });
    });
    
    document.addEventListener('click', function(e) {
      const footer = document.getElementById('footer');
      if (!footer.contains(e.target)) {
        translationScrollbar.style.display = 'none';
        currentTranslationEl.style.display = 'block';
      }
    });
    
    const savedTranslation = localStorage.getItem('selectedTranslation');
    if (savedTranslation) {
      currentTranslationEl.textContent = savedTranslation;
      updateBibleTranslation(savedTranslation);
    }
  })();
  
  function updateBibleTranslation(newTranslation) {
    document.querySelectorAll('.study-note .full-study').forEach(function(fullStudy) {
      const quoteContainers = fullStudy.querySelectorAll('.quote');
      quoteContainers.forEach(function(container) {
        const versions = container.querySelectorAll('.bible-quote');
        versions.forEach(function(version) {
          version.classList.remove('active');
          if (version.classList.contains(newTranslation.toLowerCase())) {
            version.classList.add('active');
          }
        });
      });
    });
  }
  
});
