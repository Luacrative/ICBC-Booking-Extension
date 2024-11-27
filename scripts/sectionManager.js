class SectionManager {
    #current = undefined;
    #sections = {};

    constructor() {
        for (const section of document.querySelectorAll("section")) {
            const sectionName = section.getAttribute("id");
            if (sectionName)
                this.add(section, sectionName);
        }
    }

    get(sectionName) {
        return this.#sections[sectionName]
    }

    add(section, sectionName) {
        const header = section.querySelector(".section-header");
        const arrow = section.querySelector(".expand-arrow");
        const body = section.querySelector(".section-body");
        
        if (!header || !arrow || !body) {
            console.warn(`Section "${sectionName}" is missing required elements`);
            return;
        }

        header.setAttribute("role", "button");
        header.addEventListener("click", () => {
            if (this.#current == sectionName)
                this.collapse(sectionName);
            else
                this.expand(sectionName);
        });

        this.#sections[sectionName] = { header, arrow, body };
    }

    expand(sectionName) {
        if (this.#current)
            this.collapse(this.#current);

        const section = this.#sections[sectionName];
        section.arrow.classList.remove("flipped");
        section.body.style.display = "block";
        section.header.setAttribute("aria-expanded", "true");

        this.#current = sectionName;
    }

    collapse(sectionName) {
        const section = this.#sections[sectionName];
        section.arrow.classList.add("flipped");
        section.body.style.display = "none";
        section.header.setAttribute("aria-expanded", "false");

        this.#current = undefined;
    }
}

export default new SectionManager();