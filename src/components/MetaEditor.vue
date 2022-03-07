<template>
	<b-container fluid class="p-2">		
		<b-form-row>			
			<b-col>
				<b-form-group
					label="Site code(s)" 
					label-for="siteCodes"
					label-size="md">	
					<b-form-textarea text resize
						size="sm"
						:id="siteCodes"
						:disabled="true"
						style="resize: vertical;" 
						placeholder="site codes present in data"
						:value="siteCodes"
						class="shadow-sm"		
						type="text"						
						variant="primary"/>							
				</b-form-group>
				
				<b-form-group label="Title" label-for="title">	
					<b-form-input
						size="sm"
						class="shadow-sm" 
						placeholder="(title)" 
						type="text"
						name="title" 
						v-model="title"/>
				</b-form-group>
			
				<b-form-group label="Description" label-for="description">	
					<b-form-textarea 
						size="sm"
						class="shadow-sm" 
						style="resize: vertical;" 
						placeholder="(description)" 
						rows="3"
						max-rows="6"
						type="text"
						name="description" 
						v-model="description"/>
				</b-form-group>

				<b-form-group label="Creator" label-for="creator">	
					<b-form-input
						size="sm"
						class="shadow-sm" 
						placeholder="(creator)" 
						type="text"
						name="creator" 
						v-model="creator"/>
				</b-form-group>

				<b-form-group label="Contact email address" label-for="contact">	
					<b-form-input
						size="sm" 
						class="shadow-sm" 
						placeholder="(contact email address)" 
						type="email"
						name="contact" 
						v-model="contact"/>
				</b-form-group>

				<b-form-group label="License URL" label-for="license">	
					<b-form-input
						size="sm"
						class="shadow-sm" 
						placeholder="(license URL)" 
						type="url"
						name="license" 
						v-model="license"/>
				</b-form-group>

				<b-form-group label="Version" label-for="version">	
					<b-form-input 
						size="sm"
						class="shadow-sm" 
						placeholder="(version)" 
						type="text"
						name="version" 
						v-model="version"/>
				</b-form-group>				
			</b-col>
		</b-form-row>
	</b-container>		
</template>

<script>
import { computed, inject } from "@vue/composition-api" // Vue 2 only. for Vue 3 use "from '@vue'"

export default {
	name: 'MetaEditor',
	components: { },	
	setup() {
		const store = inject('store')

		// all unique site code values used in data
		const siteCodes = computed(() => {
			const allSiteCodes = store.getters.nodes
				.map(node => node.data.siteCode)				
			return [...new Set(allSiteCodes)].filter(s => s).join(", ")
		})
		
		const title = computed({ 
			get () { return store.state.about.title },
            set (title) { store.commit('SET_ABOUT', { title })}
		})
		const description = computed({ 
			get () { return store.state.about.description },
            set (description) { store.commit('SET_ABOUT', { description })}
		})
		const creator = computed({ 
			get () { return store.state.about.creator },
            set (creator) { store.commit('SET_ABOUT', { creator })}
		})
		const contact = computed({ 
			get () { return store.state.about.contact },
            set (contact) { store.commit('SET_ABOUT', { contact })}
		}) 
		const license = computed({ 
			get () { return store.state.about.license },
            set (license) { store.commit('SET_ABOUT', { license })}
		})  
		const version = computed({ 
			get () { return store.state.about.version },
            set (version) { store.commit('SET_ABOUT', { version })}
		})   

		return { 
			siteCodes,	
			store,
			title,
			description,
			creator,
			contact,
			license,
			version
		}
	}    
}
</script>