<template>
	<b-form-group 
		:label="label"				
		label-for="itemContains">
		<b-list-group 
			class="shadow-sm overflow-auto m-1" 
			style="height: 175px;"   
			:disabled="disabled">
			<b-list-group-item v-for="(item, index) in itemsSorted" :key="index">{{item}}</b-list-group-item>
		</b-list-group>
	</b-form-group>
</template>

<script>

export default {
	name: 'ItemList',
	components: { },
	mixins: [  ],
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
	data() {
		return {}
	},
	computed: {
        itemsSorted() {
            return this.items
                .slice()
                .sort((a,b) => a > b ? 1 : -1)
        }
    },
	
	methods: {},
	// lifecycle hooks
	beforeCreate() {},
	created() {},
	beforeMount() {},
	mounted() {},
	beforeUpdate() {},
	updated() {},
	beforeDestroy() {},
	destroyed() {}
}
</script>

<style scoped>

</style>
