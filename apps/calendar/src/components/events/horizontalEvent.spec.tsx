import { h } from 'preact';

import { HorizontalEvent } from '@src/components/events/horizontalEvent';
import EventModel from '@src/model/eventModel';
import EventUIModel from '@src/model/eventUIModel';
import { render } from '@src/test/utils';
import { EventBusImpl } from '@src/utils/eventBus';

import type { ExternalEventTypes } from '@t/eventBus';

describe(`Firing 'afterRenderEvent'`, () => {
  function setup() {
    const eventBus = new EventBusImpl<ExternalEventTypes>();
    const handler = jest.fn();
    eventBus.on('afterRenderEvent', handler);
    const uiModel = EventUIModel.create(
      EventModel.create({
        id: '1',
        start: new Date(2020, 0, 1, 10, 0),
        end: new Date(2020, 0, 1, 12, 0),
      })
    );
    const props = {
      uiModel,
      eventHeight: 30,
      headerHeight: 0,
    };

    return {
      props,
      eventBus,
      handler,
    };
  }

  it(`should fire 'afterRenderEvent' when only the component is mounted`, () => {
    // Given
    const { props, eventBus, handler } = setup();

    // When
    const { rerender } = render(<HorizontalEvent {...props} />, { eventBus });

    // Then
    expect(handler).toBeCalledWith(props.uiModel.model);

    // When rerender
    handler.mockReset();
    rerender(<HorizontalEvent {...props} />);

    // Then
    expect(handler).not.toBeCalled();
  });

  it(`should not fire 'afterRenderEvent' when the component is working as a drag & drop interaction guide element`, () => {
    // Given
    const { props, eventBus, handler } = setup();
    const propsWithResizingWidth = {
      ...props,
      resizingWidth: '100px',
    };
    const propsWithMovingLeft = {
      ...props,
      movingLeft: 100,
    };

    // When (resizingWidth)
    const { rerender } = render(<HorizontalEvent {...propsWithResizingWidth} />, { eventBus });

    // Then
    expect(handler).not.toBeCalled();

    // When (movingLeft)
    rerender(<HorizontalEvent {...propsWithMovingLeft} />);

    // Then
    expect(handler).not.toBeCalled();
  });
});