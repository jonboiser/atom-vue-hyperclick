import coreModal from 'kolibri.coreVue.components.coreModal';
import kButton from 'kolibri.coreVue.components.kButton';

export default {
  name: 'welcomeModal',
  $trs: {
    welcomeModalHeader: 'Welcome to Kolibri!',
    welcomeModalContentDescription:
      'The first thing you should do is import some content from the Content tab.',
    welcomeModalPermissionsDescription:
      'The admin account you created during setup has special permissions to do this. Learn more in the Permissions tab later.',
    welcomeButtonDismissText: 'OK',
  },
  components: { coreModal, kButton },
  methods: {
    emitCloseModal() {
      this.$emit('closeModal');
    },
  },
  // data: {
  //   name: 'Jon',
  // },
  data() {
    return {
      name: 'Jona',
    };
  },
  computed: {
    foo() {
      return 'bar';
    },
    bar() {
      return 'bar';
    },
  },
  render: createElement => window.setTimeout(createElement, 750),
};
