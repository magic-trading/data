
const ROUTES = [
    { route: 'emas_report2', id: 'emas_report2', label: 'EMAS Report' },
    { route: 'bb_report', id: 'bb_report', label: 'Bollinger Report' },
]

const CSS_ROUTE = '../../styles/navbar.css'

const CURRENT_ROUTE = ROUTES.find(r => window.location.pathname.split('/').at(-2) == r.route)

class Router {

    static renderNavbar() {
        const navbarCss = document.createElement('link')

        navbarCss.type = "text/css";
        navbarCss.rel = "stylesheet";
        navbarCss.href = CSS_ROUTE;

        document.head.appendChild(navbarCss)

        const navBar = document.createElement('div')
        navBar.classList.add('navbar')

        navBar.innerHTML = ROUTES.map(route => (`
            <a href="../${route.route}" class="link ${CURRENT_ROUTE == route? 'active': ''}"> ${route.label} </a>
        `)).join('')

        document.body.insertBefore(navBar, document.body.firstChild)
    }
}


export default Router