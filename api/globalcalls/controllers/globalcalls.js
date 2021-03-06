'use strict';
const clean_adult_content = (jokes_array,adult_selection) => {
    if(!adult_selection){
        jokes_array = jokes_array.filter(elem => {
            let visibile = true;
    
            for(const tag of elem.tags){
                if(tag.adult_content) {
                    visibile = false;
                    break;
                }
            }        
            if(!visibile) return undefined;
            else return elem;
          })
    }
    return jokes_array;
};

async function filter(arr, callback) {
	const fail = Symbol()
	return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i=>i!==fail)
}
  
module.exports = {
  async getCounters(ctx) {
	const counters = {
		total_jokes: await strapi.services.jokes.count({...ctx.query}),
		deleted_jokes: await strapi.services.jokes.count({...ctx.query, status_in:['deleted']}),
		comments: await strapi.query('comment', 'comments').count({...ctx.query}),
		users: await strapi.query('user', 'users-permissions').count({...ctx.query}),
		//members: await strapi. strapi.services.users.count({...ctx.query}),
		visits: 0,
		pending_jokes: await strapi.services.jokes.countPending(ctx),
	}
	return counters;
  },

  async getLatestComments(ctx) {
	let entities;
	ctx.query = {
		...ctx.query,
		_limit: 30,
		_sort: "id:DESC",		
		// TODO: add one for status later, to filter out blocked or not active comments
	  };

	if (ctx.query._q) {
		entities = await strapi.query('comment', 'comments').search(ctx.query);
	} else {
		entities = await strapi.query('comment', 'comments').find(ctx.query,);
	}

	//remove deleted jokes and adult content
	entities = await filter(entities, async elem => {
		let keep = true;
		if(elem.related[0].status == 'deleted'){
			keep = false;
		}
		
		let istrue = await strapi.services.globalcalls.isAdultJoke(elem.related[0].id);
		if(istrue){
			console.log("is adult")
			keep = false;
		}

		return keep;
	})

	//console.log(entities[0])
	return entities.slice(0,10);

	},
  
    async updateProfile(ctx){
        return;
    }
  
};
