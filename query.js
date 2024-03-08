/* Usage Examples
```dataviewjs
const {Query} = customJS;

Query.setDataview(dv);
const allFiles = Query.selectAllFiles();
const entity = allFiles.find(x => x.basename == "엔티티");

const cache = app.metadataCache.getFileCache(entity);
const tagPredicate = (tagName) => tagName === "#entity" || tagName === "#index";
const sectionList = await Query.selectSectionsByTag(entity, tagPredicate);
const headers = ["Link", "Heading", "Content"];
const rows = sectionList.map((x, idx) => 
[x.link, x.heading, x.content]);
dv.table(headers, rows);
```
*/

class Query {

    _dv = null;

    setDataview(dv) {
        this._dv = dv;
    }

    selectAllFiles = () => {
        const allFiles = app.vault.getMarkdownFiles();
        return allFiles;
    }

    newHeading = (text, level) => {
        if (0 < level) {
            return "#".repeat(level) + " " + text;
        }
        else {
            return text;
        }
    }

    newSection = (heading, link, content) => {
        return {
            heading: heading,
            link: link,
            content: content,
        }
    }

    selectSectionsByTag = async (file, tagPredicate) => {
        const sectionList = [];
        const fileContent = await this._dv.io.load(file.path);
        const fileCache = app.metadataCache.getFileCache(file);
        const tags = fileCache.tags;
        const headings = fileCache.headings;

        for (const tag of tags) {
            if (tagPredicate(tag.tag)) {
                const heading = headings.find(h => h.position.start.line === tag.position.start.line);
                const sectionStart = heading.position.end.offset + 1;

                const nextHeading = headings.find(h => h.level <= heading.level &&
                    h.position.start.line > heading.position.start.line);

                const headingText = this.newHeading(heading.heading, heading.level);
                const sectionLink = this._dv.sectionLink(file.basename, heading.heading);
                const sectionContent = nextHeading
                    ? fileContent.substring(sectionStart, nextHeading.position.start.offset)
                    : fileContent.substring(sectionStart);

                const section = this.newSection(headingText, sectionLink, sectionContent);
                sectionList.push(section);
            }
        }
        return sectionList;
    }

    selectSectionsByHeading = async (file, headingPredicate) => {
        const sectionList = [];
        const fileContent = await this._dv.io.load(file.path);
        const fileCache = app.metadataCache.getFileCache(file);
        const headings = fileCache.headings;

        for (const heading of headings) {
            if (headingPredicate(heading)) {
                const sectionStart = heading.position.end.offset + 1;

                const nextHeading = headings.find(h => h.level <= heading.level &&
                    h.position.start.line > heading.position.start.line);

                const headingText = this.newHeading(heading.heading, heading.level);
                const sectionLink = this._dv.sectionLink(file.basename, heading.heading);
                const sectionContent = nextHeading
                    ? fileContent.substring(sectionStart, nextHeading.position.start.offset)
                    : fileContent.substring(sectionStart);

                const section = this.newSection(headingText, sectionLink, sectionContent);
                sectionList.push(section);
            }
        }
        return sectionList;
    }

    /**
     * 
     * @param {TFile} file 
     */
    selectSectionsByTagName = async (file, tagName) => {
        return this.selectSectionsByTag(file, tag => tag === tagName);
    }


    /**
     * 
     * @param {TFile} file 
     * @param {*} headingLevel 
     * @returns 
     */
    selectSectionsByHeadingLevel = async (file, headingLevel) => {
        return this.selectSectionsByHeading(file, heading => heading.level === headingLevel);
    }

}