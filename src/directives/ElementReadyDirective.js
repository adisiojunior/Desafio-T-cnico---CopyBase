// ElementReadyDirective.js
export default {
  inserted(el, binding) {
    binding.value(el);
  }
};
