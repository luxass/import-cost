<script>
  import { confetti } from "@neoconfetti/svelte";

  export const name = "import-cost";

  function getName() {
    return name;
  }

  $: document.title = name;
  $: {
    console.log("hi");
  }
  $: _name = getName();
</script>

<svelte:head>
  <title>Sverdle {_name}</title>
  <meta name="description" content="A Wordle clone written in SvelteKit" />
</svelte:head>

<h1>Sverdle</h1>
