<template>    
    <Layout/>    
</template>

<script>
import Layout from '@/components/Layout.vue'

export default { 
    name: 'App',
    components: { 
        Layout          
    },
    data: function() {
        return {}
    },
    computed: {},
    mounted() {
		document.title = `${this.$store.getters.appName} v${this.$store.getters.appVersion}`
	},
}
</script>

<style>
html,body {
	margin:0;
	padding:0;
	height:100%; /* needed for container min-height */
	/*background:gray;*/
	
	font-family:arial,sans-serif;
	font-size:small;
	/*color:#666;*/
}
</style>