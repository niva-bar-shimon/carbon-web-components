import settings from 'carbon-components/es/globals/js/settings';
import { ifDefined } from 'lit-html/directives/if-defined';
import { html, property, customElement, LitElement } from 'lit-element';
import HostListener from '../../globals/decorators/HostListener';
import HostListenerMixin from '../../globals/mixins/HostListener';
import RadioGroupManager, { NAVIGATION_DIRECTION, ManagedRadioButtonDelegate } from '../../globals/internal/radio-group-manager';
import styles from './structured-list.scss';

const { prefix } = settings;

/**
 * Map of navigation direction by key.
 */
const navigationDirectionForKey = {
  ArrowUp: NAVIGATION_DIRECTION.BACKWARD,
  ArrowDown: NAVIGATION_DIRECTION.FORWARD,
};

/**
 * The interface for `RadioGroupManager` for structured list row.
 */
class StructuredListRowRadioButtonDelegate implements ManagedRadioButtonDelegate {
  /**
   * The structured list row to target.
   */
  private _row: BXStructuredListRow;

  constructor(row: BXStructuredListRow) {
    this._row = row;
  }

  get checked() {
    return this._row.selected;
  }

  set checked(checked) {
    this._row.selected = checked;
    this._row.tabIndex = checked ? 0 : -1;
  }

  get tabIndex() {
    return this._row.tabIndex;
  }

  set tabIndex(tabIndex) {
    this._row.tabIndex = tabIndex;
  }

  get name() {
    return this._row.selectionName;
  }

  compareDocumentPosition(other: StructuredListRowRadioButtonDelegate) {
    return this._row.compareDocumentPosition(other._row);
  }

  focus() {
    this._row.focus();
  }
}

/**
 * Structured list row.
 */
@customElement(`${prefix}-structured-list-row` as any)
class BXStructuredListRow extends HostListenerMixin(LitElement) {
  /**
   * The radio group manager associated with the radio button.
   */
  private _manager: RadioGroupManager | null = null;

  /**
   * The interface for `RadioGroupManager` for structured list row.
   */
  private _radioButtonDelegate = new StructuredListRowRadioButtonDelegate(this);

  /**
   * Handles `click` event on this element.
   */
  @HostListener('click')
  // @ts-ignore: The decorator refers to this method but TS thinks this method is not referred to
  private _handleClick = () => {
    const input = this.shadowRoot!.getElementById('input') as HTMLInputElement;
    if (input) {
      this.selected = true;
      if (this._manager) {
        this._manager.select(this._radioButtonDelegate);
      }
    }
  };

  /**
   * Handles `keydown` event on this element.
   */
  @HostListener('keydown')
  // @ts-ignore: The decorator refers to this method but TS thinks this method is not referred to
  private _handleKeydown = (event: KeyboardEvent) => {
    const input = this.shadowRoot!.getElementById('input') as HTMLInputElement;
    const manager = this._manager;
    if (input && manager) {
      const navigationDirection = navigationDirectionForKey[event.key];
      if (navigationDirection) {
        manager.select(manager.navigate(this._radioButtonDelegate, navigationDirection));
      }
      if (event.key === ' ' || event.key === 'Enter') {
        manager.select(this._radioButtonDelegate);
      }
    }
  };

  /**
   * `true` if this structured list row should be selectable and selected. Corresponds to the attribute with the same name.
   */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /**
   * The `name` attribute for the `<input>` for selection. Corresponds to `selection-name` attribute.
   * If present, this structured list row will be a selectable one.
   */
  @property({ attribute: 'selection-name' })
  selectionName = '';

  /**
   * The `value` attribute for the `<input>` for selection. Corresponds to `selection-value` attribute.
   * If present, this structured list row will be a selectable one.
   */
  @property({ attribute: 'selection-value' })
  selectionValue = '';

  connectedCallback() {
    super.connectedCallback();
    if (!this._manager) {
      this._manager = RadioGroupManager.get(this.getRootNode({ composed: true }) as Document);
      const { selectionName } = this;
      if (selectionName) {
        this._manager!.add(this._radioButtonDelegate);
      }
    }
  }

  disconnectedCallback() {
    if (this._manager) {
      this._manager.delete(this._radioButtonDelegate);
    }
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    const { _manager: manager, selectionName } = this;
    if (changedProperties.has('selectionName')) {
      if (manager) {
        if (selectionName) {
          manager.add(this._radioButtonDelegate);
        } else {
          manager.delete(this._radioButtonDelegate);
        }
      }
      this.setAttribute(
        'tabindex',
        !selectionName || !manager || !manager.shouldBeFocusable(this._radioButtonDelegate) ? '-1' : '0'
      );
    }
  }

  render() {
    const { selected, selectionName, selectionValue } = this;
    if (selectionName) {
      // "Selected" style with `.bx--structured-list-td` does not work somehow - Need investigation
      return html`
        <slot></slot>
        <input
          id="input"
          type="radio"
          class="${prefix}--structured-list-input"
          ?checked=${selected}
          name=${selectionName}
          value=${ifDefined(selectionValue)}
        />
        <div class="${prefix}--structured-list-td ${prefix}--structured-list-cell">
          <svg
            focusable="false"
            preserveAspectRatio="xMidYMid meet"
            aria-label="select an option"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            role="img"
            class="${prefix}--structured-list-svg"
            style="will-change: transform;"
          >
            <title>select an option</title>
            <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zM7 11L4.3 8.3l.9-.8L7 9.3l4-3.9.9.8L7 11z"></path>
            <path d="M7 11L4.3 8.3l.9-.8L7 9.3l4-3.9.9.8L7 11z" opacity="0"></path>
          </svg>
        </div>
      `;
    }
    return html`
      <slot></slot>
    `;
  }

  static styles = styles;
}

export default BXStructuredListRow;