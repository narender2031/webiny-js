// @flow
import React, { useCallback } from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { getPlugins } from "@webiny/plugins";
import { set } from "dot-prop-immutable";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";
import { get } from "dot-prop-immutable";
import { ReactComponent as AlignCenterIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_center.svg";
import { ReactComponent as AlignLeftIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_left.svg";
import { ReactComponent as AlignRightIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_right.svg";

// Icons map for dynamic render
const icons = {
    "flex-start": <AlignLeftIcon />,
    center: <AlignCenterIcon />,
    "flex-end": <AlignRightIcon />
};

const alignments = Object.keys(icons);

const HorizontalAlignActionFlex = ({ element, children, updateElement }: Object) => {
    const align = get(element, "data.settings.horizontalAlignFlex") || "flex-start";

    const onClick = useCallback(() => {
        const nextAlign = alignments[alignments.indexOf(align) + 1] || "flex-start";

        updateElement({
            element: set(element, "data.settings.horizontalAlignFlex", nextAlign)
        });
    }, [element, align]);

    const plugin = getPlugins("pb-page-element").find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    return React.cloneElement(children, { onClick, icon: icons[align] });
};

export default connect(
    state => ({ element: getActiveElement(state) }),
    { updateElement }
)(HorizontalAlignActionFlex);
