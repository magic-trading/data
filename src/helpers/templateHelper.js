import helpersImported from "./helpers.js";

const TEMPLATES_FOLDER = '../../templates';

class TemplateHelper {
    constructor() {
        console.log()
        if(!window.templates) {
            window.templates = {};
        }
    }

    render(path, variables, element) {
        try {
            const template = this.getTemplate(path)

            const templateReady = this.patch(template, variables);

            if(element) {
                element.innerHTML = templateReady;
            }

            return templateReady;
        } catch (error) {
            console.log(error)
            return null;
        }
    }

    patch(string, $) {
        var regexp = /\[([^\[]*?)\]/g;

        const _ = this;

        const helpers = helpersImported;

        const getValue = (object, key) => {
            return object[key];
        }

        
        return string.replace(regexp, (ignore, key) => {
            if(!key.includes(' ')) {
                key = `$.${key}`
            }
            const result = eval(key)
            if(result instanceof Element) {
                return result.outerHTML;
            }
            return result;
        });
    }

    getTemplate(path) {
        return window.templates[path];
    }

    async loadTemplate(path) {
        if(window.templates?.[path]) {
            return window.templates[path];
        }

        const request = fetch(`${TEMPLATES_FOLDER}/${path}.html`);
        const response = await request;
        const template = await response.text();

        window.templates[path] = template;

        return template;
    }

    preloadTemplates(paths){
        return Promise.all(paths.map(path => this.loadTemplate(path)));
    }

    renderEach(array, path, customItemKey, extraVariables = {}, elementContainer) {
        const children = array.map((item, i) => {
            const variables = { i, ...extraVariables, [customItemKey || 'item']: item };
            return this.render(path, variables)
        }).join('')

        if(elementContainer) {
            elementContainer.innerHTML = children
            return elementContainer;
        }

        return children;
    }
}

export default new TemplateHelper();