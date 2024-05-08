import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class IndexRoute extends Route {
    @service router;
    count = 1;
    flag = false;
    queryParams = {
        logtype: {
          refreshModel: false
        },
        searchquery: {
          refreshModel: true
        },
        page: {
          refreshModel: true
        },
        pagesize: {
          refreshModel: true
        },
    };

    @action
    resetCount() {
        this.count = 1;
    }

    pageOld = 1;
    lastPage =  Math.ceil(this.totalHits / this.pagesize);
    currentPage = 1;
    searchResults = [];

    async loadMoreLogs(query, page, pagesize) {

        page ;
        pagesize ;

        
        const searchUrl = new URL('http://localhost:8080/LogFetcher/logFetcher');
        searchUrl.searchParams.append("searchquery", query);
        searchUrl.searchParams.append("page", page);
        searchUrl.searchParams.append("resultsPerPage", pagesize);

        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            let data = null;
            try {
                data = await response.json();
            } catch(e) {
                console.log(e);
                return {
                    TotalHits: 0,
                    searchResults: []
                };
            }
            console.log("debug: response", data);
            const Result = data.searchResults;
        
            return data;
    
        } else {
            console.error("unable to fetch search results, status: ", response.status);
            return {
                TotalHits: 0,
                searchResults: []
            };
        }
    }



    async model (params) {

        console.log('debug: generating index model');
        console.log(`debug: params.searchquery=${params.searchquery}`);
        console.log(`debug: params.page=${params.page}`);
        console.log(`debug: params.pagesize=${params.pagesize}`);

        const pageNew = params.page;
        const pagesizeNew = params.pagesize;
        const searchqueryNew = params.searchquery;

        let logs;
        if (pageNew < this.pageOld) {
            this.flag = true;
            console.log("ppn",pageNew,"ppo",this.pageOld,"pcount",this.count);
            const startIndex = (pageNew-1)*pagesizeNew;
            const page =this.searchResults.slice(startIndex, startIndex+pagesizeNew);
            logs = {
                searchResults: page
            };
        } else {
            console.log("pn",pageNew,"po",this.pageOld,"count",this.count);
            if(this.count <= pageNew){
                if(this.flag){
                    if(pageNew == this.count) return;
                    this.flag= false;
                }
                this.count = pageNew;  
                logs = await this.loadMoreLogs(searchqueryNew, pageNew, pagesizeNew);
                this.searchResults.push(...logs.searchResults);
            }
        }
        this.pageOld = pageNew;
        return logs;
    }
}

