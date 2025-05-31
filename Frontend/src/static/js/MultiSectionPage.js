export class MultiSectionPage {
    /**
     * @type {Set<HTMLDivElement>} 
     */
    sectionSet = new Set();

    clearSectionList() {
        const deleted = Array.from(this.sectionSet);
        this.sectionSet.clear();
        return deleted;
    }

    /**
     * 
     * @param {...HTMLDivElement} section
     */
    addSection(...section) {
        section.forEach(sec => this.sectionSet.add(sec));
    }

    /**
     * 
     * @param {HTMLDivElement} section
     */
    showSection(section) {
        for (const sec of this.sectionSet) {
            if (sec === section) {
                sec.classList.remove('hidden');
            } else {
                sec.classList.add('hidden');
            }
        }
    }
}