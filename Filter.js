(function () {

    if (!Element.prototype.closest) {

        Element.prototype.closest = function (css) {
            let node = this;

            while (node) {
                if (node.msMatchesSelector(css)) return node;
                else node = node.parentElement;
            }
            return null;
        };
    }

})();

function DataFilter(options) {
    /*
        options = {
                parent: Node || body,
                delay: Number || 0,
                startWithOnly: Bool || true
            }
     */
    this.parentNode = options.parent || document.body;
    this.searchInput = document.createElement('input');
    this.listContainer = document.createElement('div');
    this.list = document.createElement('ul');
    this.timeDelay = options.delay || 0;
    this.data = [];
    this.isShowFinished = false;
    this.lastIndexShow = 0;
    this.hideSearchForm = this.hideSearchForm.bind(this);
    this.buttonNavigation = this.buttonNavigation.bind(this);
    this.focusedElement = null;
    this.startWithOnly = options.startWithOnly === undefined ? true : options.startWithOnly;
    this.initialize()
}

DataFilter.prototype.initialize = function () {
    this.listContainer.hidden = true;
    const dataFilterContainer = document.createElement('div');
    dataFilterContainer.classList.add('filter-container');
    this.parentNode.appendChild(dataFilterContainer);
    const searchForm = document.createElement('div');
    const wrapDiv = document.createElement('div');
    wrapDiv.classList.add('wrap');
    searchForm.classList.add('search-form');
    searchForm.appendChild(this.searchInput);
    this.searchInput.classList.add('search-input');
    this.listContainer.classList.add('list-container');
    searchForm.appendChild(this.listContainer);
    wrapDiv.appendChild(searchForm);
    dataFilterContainer.appendChild(wrapDiv);
    this.listContainer.appendChild(this.list);

    this.searchInput.onclick = function (event) {
        if (event.target.value) {
            this.searchData(event)
        }
    }.bind(this);

    this.listContainer.onclick = function (event) {
        this.chooseResult();
    }.bind(this);

    this.listContainer.onscroll = function (event) {
        if (!this.isShowFinished && this.listContainer.scrollHeight -
            this.listContainer.scrollTop -
            this.listContainer.clientHeight < this.listContainer.scrollHeight / 10) {
            this.showPartOfResult(20);
        }
    }.bind(this);

    this.searchInput.onkeydown = function(event) {
        if (event.which === 40 && this.searchInput.value && !this.isListShowed) {
            this.searchData(event)
        }
    }.bind(this);

    this.searchInput.onfocus = function (event) {
        dataFilterContainer.style.zIndex = '999';
    };

    this.searchInput.onblur = function () {
        // if (this.isListShowed) {
        //     this.hideSearchForm();
        // }
        dataFilterContainer.style.zIndex = '0';
    }.bind(this);

    this.searchInput.oninput = function (event) {
        this.inputSymbol(event)
    }.bind(this);

    this.list.onmousemove = function (event) {
        const rootLi = event.target.closest('.list-container > ul > li');
        if (rootLi && rootLi === this.focusedElement) {
            return;
        }
        this.setFocusItem(rootLi);
    }.bind(this)
};

DataFilter.prototype.inputSymbol = function (event) {
    if (!this.timeDelay) {
        this.searchData(event);
        return;
    }
    if (this.timer) clearTimeout(this.timer);
    this.hideSearchForm();
    this.timer = setTimeout(this.searchData.bind(this), this.timeDelay, event)
};


DataFilter.prototype.chooseResult = function () {
    if (!this.focusedElement) {
        return;
    }
    this.searchInput.value = this.focusedElement.textContent;
    this.hideSearchForm();
    this.searchInput.focus();
};

DataFilter.prototype.searchData = function (event) {
    this.list.innerHTML = '';
    this.isShowFinished = false;
    this.result = [];
    this.lastIndexShow = 0;
    this.focusedElement = null;


    if (!event.target.value) {
        this.isListShowed && this.hideSearchForm();
        return
    }
    console.time('find');

    this.filterFunction(event);

    this.showSearchForm();
    console.timeEnd('find');
};

DataFilter.prototype.filterFunction = function (event) {
    const searchText = event.target.value.toLowerCase();
    if (this.startWithOnly) {
        this.result = this.data.filter(function (item) {
            return item.toString().toLowerCase().indexOf(searchText) === 0
        }.bind(this));
        return;
    }
    this.result = this.data.filter(function (item) {
        return ~item.toString().toLowerCase().indexOf(searchText)
    });
};

DataFilter.prototype.showSearchForm = function () {
    if (!this.result.length) {
        return
    }
    this.showPartOfResult(30);
    this.listContainer.hidden = false;
    this.listContainer.scrollTop = 0;
    if (!this.isListShowed) {
        document.addEventListener('click', this.hideSearchForm);
        document.addEventListener('keydown', this.buttonNavigation);
        this.isListShowed = true;
    }
};

DataFilter.prototype.showPartOfResult = function (step) {
    let index = this.lastIndexShow;
    for (index; index < this.lastIndexShow + step; index++) {
        if (this.result[index] === undefined) {
            this.isShowFinished = true;
            return;
        }
        this.createItemWithResult(index);
    }
    this.lastIndexShow += step;
};

DataFilter.prototype.createItemWithResult = function (index) {
    const li = document.createElement('li');
    li.innerHTML = this.result[index];
    this.list.appendChild(li);
};


DataFilter.prototype.buttonNavigation = function (event) {
    if (event.which === 27) {
        this.hideSearchForm();
    } else if (event.which === 40) {
        this.setFocusItem();
        event.preventDefault()
    } else if (event.which === 38) {
        this.setFocusItem(undefined, true);
        event.preventDefault()
    } else if (event.which === 13) {
        this.chooseResult()
    }

};

DataFilter.prototype.setFocusItem = function (el, isUp) {
    if (!this.isListShowed) {
        return;
    }
    if (el) {
        this.focusedElement && this.focusedElement.classList.remove('filter-focus');
        el.classList.add('filter-focus');
        this.focusedElement = el;
        return;
    }
    if (this.focusedElement) {
        const nextElement = isUp ? this.focusedElement.previousElementSibling : this.focusedElement.nextElementSibling;
        if (!nextElement) {
            return;
        }
        this.focusedElement.classList.remove('filter-focus');
        nextElement.classList.add('filter-focus');
        this.focusedElement = nextElement;
        if (this.focusedElement.offsetTop > this.listContainer.scrollTop + this.listContainer.clientHeight) {
            this.focusedElement.scrollIntoView(false);
        }
        if (this.focusedElement.offsetTop - this.focusedElement.clientHeight < this.listContainer.scrollTop) {
            this.focusedElement.scrollIntoView();
        }
        return;
    }
    const firstListElem = this.listContainer.getElementsByTagName('li')[0];
    firstListElem && firstListElem.classList.add('filter-focus');
    this.focusedElement = firstListElem;
};

DataFilter.prototype.hideSearchForm = function (event) {
    if (event && event.target === this.searchInput) {
        return;
    }
    this.listContainer.scrollTop = 0;
    this.listContainer.hidden = true;
    document.removeEventListener('keydown', this.buttonNavigation);
    document.removeEventListener('click', this.hideSearchForm);
    this.focusedElement = null;
    this.isListShowed = false;
};

DataFilter.prototype.setData = function (data) {
    this.data = data;
    console.log(data.length)
};

DataFilter.prototype.addData = function (newData) {
    if (!Array.isArray(newData)) {
        alert('Data must be Array. Now: ' + typeof newData);
        return;
    }
    this.data = this.data.concat(newData)
};

DataFilter.prototype.setUrl = function (url) {
    this.url = url;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', this.url);
    xhr.onreadystatechange = function () {
        this.searchInput.placeholder = 'loading data...';
        if (xhr.readyState !== 4) return;
        if (xhr.status === 200) {
            this.setData(JSON.parse(xhr.response));
            this.searchInput.placeholder = '';
        }
    }.bind(this);

    xhr.send();
};


//============================================================

function DataFilterWithId(options) {
    /*
        options = {
            parent: Node : body,
            delay: Number : 0,
            ?separator: String,
            cb: Function : log(id),
            startWithOnly: Bool : true
        }
     */
    DataFilter.call(this, options);
    this.idPosition = 0;
    this.dataFilterPosition = 1;
    this.usersIdMap = new Map();
    this.cb = options.cb || function (id) {
        console.log(id)
    };
    this.separator = options.separator;
}

Object.setPrototypeOf(DataFilterWithId.prototype, DataFilter.prototype);

DataFilterWithId.prototype.filterFunction = function (event) {
    this.usersIdMap = new Map();
    const searchText = event.target.value.toLowerCase();
    if (this.startWithOnly) {
        this.result = this.data.filter(function (item) {
            return item[this.dataFilterPosition].toString().toLowerCase().indexOf(searchText) === 0
        }.bind(this));
        return;
    }
    this.result = this.data.filter(function (item) {
        return ~item[this.dataFilterPosition].toString().toLowerCase().indexOf(searchText)
    }.bind(this));
};

DataFilterWithId.prototype.createItemWithResult = function (index) {
    const li = document.createElement('li');
    li.innerHTML = this.result[index][this.dataFilterPosition];
    this.list.appendChild(li);
    this.usersIdMap.set(li, this.result[index][this.idPosition])
};

DataFilterWithId.prototype.chooseResult = function () {
    if (!this.focusedElement) {
        return;
    }
    this.searchInput.value = this.focusedElement.textContent;
    this.cb(this.usersIdMap.get(this.focusedElement));
    this.hideSearchForm();
    this.searchInput.focus();
};

DataFilterWithId.prototype.setData = function (data) {
    console.log(data.length)
    if (this.separator) {
        this.data = data.map(function (item) {
            return item.split(this.separator)
        }.bind(this));
        return;
    }
    this.data = data;
};


//============================================================

function DataFilterUpdatedRequest(options) {
    /*
        options = {
                parent: Node || body,
                delay: Number || 0,
                ?separator: String,
                cd: Function : log(id),
                startWithOnly: Bool || true,
                countOfSymbol: Number || 3
            }
     */
    DataFilterWithId.call(this, options);
    this.countOfSymbol = options.countOfSymbol || 3;
    this.lastQueryString = '';
}

Object.setPrototypeOf(DataFilterUpdatedRequest.prototype, DataFilterWithId.prototype);

DataFilterUpdatedRequest.prototype.inputSymbol = function (event) {
    const text = event.target.value;

    if (text.length < this.countOfSymbol) {
        if (this.isListShowed) {
            this.hideSearchForm();
        }
        return;
    }

    if (!this.lastQueryString || text.indexOf(this.lastQueryString) !== 0) {
        this.lastQueryString = text;
        this.downloadData(event, text);
        return;
    }

    if (!this.timeDelay) {
        this.searchData(event);
        return;
    }
    if (this.timer) clearTimeout(this.timer);
    this.hideSearchForm();
    this.timer = setTimeout(this.searchData.bind(this), this.timeDelay, event)
};

DataFilterUpdatedRequest.prototype.setUrl = function (url) {
    this.url = url;
};

DataFilterUpdatedRequest.prototype.downloadData = function (event, text) {
    const lastData = text;
    const xhr = new XMLHttpRequest();
    const url = this.url + '?text=' + text;
    xhr.open('GET', url);
    xhr.onreadystatechange = function () {
        this.searchInput.placeholder = 'loading data...';
        if (xhr.readyState !== 4) return;
        if (xhr.status === 200) {
            console.log(lastData);
            if (text === lastData) {
                this.setData(JSON.parse(xhr.response));
                this.searchData(event);
            }
            this.searchInput.placeholder = '';
        }
    }.bind(this);

    xhr.send();
};

