<template>
	<div>
		<MyComponent/>
		<p :title="hello">{{ fullMessage }}</p>
	</div>
</template>

<script>
import PhaserCommon from '@/composables/PhaserCommon'
import MyComponent from '@/components/MyComponent'

export default {
	name: 'ComponentTemplate',
	components: {
		MyComponent 
	},
	mixins: [ PhaserCommon ],
	props: {
		name: {
			type: String,
			required: false,
			default: "Fred" 
		}		
	},
	data() {
		return {
			hello: "Hello"
		}
	},
	computed: {	
		fullMessage() {
			return `${this.hello}, ${this.name}`
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
p {
	color: blue;
	background: white;
}
</style>
<!--note see https://github.com/vuejs/awesome-vue for VUE examples and resources-->