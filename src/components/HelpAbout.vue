<template>
	<b-modal centered id="modalAbout" title="About">
		<div class="text-center">
			<img src="phaser-spacedout-logo.png" class="mb-3">
			<p>Version {{ $store.getters.appVersion }}</p>				
			<p>A stratigraphic matrix editing tool</p>
			<p>Created as part of the MATRIX project</p>
			<a target="_blank" href="https://stratigraphic.github.io/matrix/">https://stratigraphic.github.io/matrix/</a>

		</div>
		<!--this removes default buttons from modal-->
		<template #modal-footer><div></div></template>
	</b-modal>	
</template>

<script>

export default {
	name: 'HelpAbout',
	components: {},
	mixins: [],
	props: {},
	data() { return {} },
	computed: {},		
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