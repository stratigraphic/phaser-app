<template>
	<b-form-group 
		:label="label"				
		label-for="itemContains">		
		<b-list-group 
			class="overflow-auto" 
			style="height: 200px;"   
			:disabled="disabled">
			<b-list-group-item v-for="(item, index) in itemsSorted" 				
				class="p-0 m-0" 
				:key="index">{{ item }}</b-list-group-item>
		</b-list-group>
	</b-form-group>
</template>

<script>
import { computed } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"

export default {
	props: {
		disabled: {
			type: Boolean,
			required: false,
			default: false 
		},
        label: {
            type: String,
            required: false,
            default: "Contains"
        },
        items: {
            type: Array,
            required: false,
            default: () => []
        }	
	},
	setup(props) {
        const itemsSorted = computed(() => props.items.slice().sort((a,b) => a > b ? 1 : -1))
	
		return { itemsSorted }
	}	
}
</script>
<style scoped>
.list-group-item {
	height: 10px;
    padding: 1px 1px;
}
</style>
