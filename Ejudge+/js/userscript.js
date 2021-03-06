//////////// Utils ////////////

const storageGet = arg => {
    return new Promise(resolve => chrome.storage.sync.get(arg, resolve))
}

const storageSet = arg => {
    return new Promise(resolve => chrome.storage.sync.set(arg, resolve))
}

//////////// Title ////////////

const parseTitleInfo = title => {
    const infoRegExp = /([a-zA-Zа-яА-Я ]+)\[.*(17[0-9]-[12])/

    const res = title.match(infoRegExp)
    if (!res) {
        return null
    }

    const info = [res[1].trim(), res[2].trim()]
    if (info[0] === "User login page") {
        return null
    }

    return info
}

const beautifyTitle = elem => {
    elem.innerHTML = "Кокосик"
    elem.style.opacity = "1"
}

//////////// Problems ////////////

const filterProblemsByReg = (problems, regexp) => {
    try {
        const reg = new RegExp(regexp)
        return problems.filter(it => reg.test(it.innerText))
    } catch (e) {}
    return []
}

const hideProblems = (problems, options) => {
    problems.forEach(it => (it.style.display = ""))

    const hideOk = options.hideOk
        ? Array.from(document.querySelectorAll("#probNavRightList .probOk"))
        : []

    const hideBad = options.hideBad
        ? Array.from(document.querySelectorAll("#probNavRightList .probBad"))
        : []

    const hideNew = options.hideNew
        ? Array.from(document.querySelectorAll("#probNavRightList .probEmpty"))
        : []

    const hideReg = options.hideReg
        ? filterProblemsByReg(problems, options.hideReg)
        : []

    const hide = [...hideOk, ...hideBad, ...hideNew, ...hideReg]
    hide.forEach(it => (it.style.display = "none"))
}

const storeProblems = problems => {
    const problemsStorage = {}

    problems.forEach(it => {
        const problem = {
            name: it.innerText,
            link: it.children[0].href,
        }

        problemsStorage[`problem_${problem.name}`] = problem
    })

    storageSet(problemsStorage)
}

//////////// Table ////////////

const updateProblemHeader = (h, problem) => {
    const a = document.createElement("a")
    a.href = problem.link
    a.textContent = problem.name

    h.firstChild.remove()
    h.appendChild(a)
}

const tableUpdate = () => {
    const problemsList = document.querySelectorAll("th.st_prob")
    if (!problemsList) {
        console.log("Table header not found.")
        return
    }

    const problems = Array.from(problemsList)

    problems.forEach(h => {
        const key = `problem_${h.innerText}`
        storageGet(key)
            .then(it => it[key])
            .then(problem => problem && updateProblemHeader(h, problem))
    })
}

//////////// Main ////////////

const problemsUpdate = () => {
    const problemsList = document.querySelector("#probNavRightList")
    if (!problemsList) {
        console.log("Side panel with problems not found.")
        return
    }

    const problems = Array.from(problemsList.children)

    const fetchAndUpdate = () =>
        storageGet({
            hideOk: false,
            hideBad: false,
            hideNew: false,
            hideReg: "",
        }).then(options => hideProblems(problems, options))

    // hide by current options
    fetchAndUpdate()

    // listen for options updates
    chrome.runtime.onMessage.addListener(request => {
        if (request.type === "fkm-update-problems") {
            fetchAndUpdate()
        }
    })

    // save problems in storage
    storeProblems(problems)
}

const kokosUpdate = () => {
    const titleElem = document.querySelector("#l12 .main_phrase")
    if (!titleElem) {
        console.log("Title not found, not ejudge page. Exiting Ejudge+...")
        return
    }

    const info = parseTitleInfo(titleElem.innerText)
    beautifyTitle(titleElem)

    if (!info) {
        console.log("Title not parsed. Login page?")
        return
    }

    problemsUpdate()
    tableUpdate()
    storageSet({ fkmInfo: info })
}

kokosUpdate()
