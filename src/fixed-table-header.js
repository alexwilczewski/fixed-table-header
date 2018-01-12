/*
 * Angular Fixed Table Header
 * https://github.com/daniel-nagy/fixed-table-header
 * @license MIT
 * v0.2.1
 */
(function (window, angular, undefined) {
'use strict';

angular.module('fixed.table.header', []).directive('fixHead', fixHead);

function fixHead($compile, $window) {
    function compile(tElement) {
        var headerClone = getCloneToMaintainRemovedDirectivesPostCompile();
        function getCloneToMaintainRemovedDirectivesPostCompile() {
            var clone = tElement.clone();
            clone.removeAttr('fix-head').removeAttr('ng-if');
            return clone;
        }

        return function postLink($scope, $element) {
            var table = {
                clone: $element.parent().clone().empty(),
                original: $element.parent()
            }, header = {
                clone: headerClone,
                original: $element
            }, cells,
                parentContainer = table.original.parent(),
                scrollContainer = getScrollContainer(table.original);

            table.clone.css({overflow: 'hidden', position: 'relative'}).addClass('clone');
            header.original.css('visibility', 'hidden');

            insertIntoDom();
            compileClonedTable();
            addWatchToReassignCells();
            addWatchForHeaderHeight();
            updatePositionOnScroll();

            header.original.on('$destroy', function () {
                header.clone.remove();
            });

            function insertIntoDom() {
                insertHeaderCloneToCompileWithProperLinking();
                table.clone.append(header.clone);
                parentContainer[0].insertBefore(table.clone[0], table.original[0]);
            }
            function insertHeaderCloneToCompileWithProperLinking() {
                header.original.after(header.clone);
            }

            function compileClonedTable() {
                $compile(table.clone)($scope);
            }

            function addWatchToReassignCells() {
                $scope.$watch(getCalculatedClonedCellCount, reassignCellsAndInitialize);
            }
            function getCalculatedClonedCellCount() {
                return header.clone.find("th").length;
            }
            function reassignCellsAndInitialize() {
                cells = {
                    clone: getCells(header.clone),
                    original: getCells(header.original)
                };
                addWatchToMatchCellWidths();
            }
            function getCells(node) {
                return Array.prototype.map.call(node.find('th'), function (cell) {
                    return angular.element(cell);
                });
            }
            function addWatchToMatchCellWidths() {
                cells.clone.forEach(function (cloned, idx) {
                    addWatchToMatchWidthIfNecessary(cloned, cells.original[idx]);
                });
            }
            function addWatchToMatchWidthIfNecessary(clonedCell, originalCell) {
                if (!isClonedCellMatchingWidth(clonedCell)) {
                    addWatchToMatchWidth(clonedCell, originalCell);
                }
            }
            function isClonedCellMatchingWidth(clonedCell) {
                return clonedCell.data(ISWATCHING);
            }
            function addWatchToMatchWidth(clonedCell, originalCell) {
                var listener = $scope.$watch(getOriginalWidth, setClonedWidth);
                assignWatchIsEngaged(clonedCell);
                clonedCell.on("$destroy", function () {
                    listener();
                });
                originalCell.on("$destroy", function () {
                    clonedCell.remove();
                });

                function getOriginalWidth() {
                    return $window.getComputedStyle(originalCell[0]).width;
                }
                function setClonedWidth(newWidth) {
                    clonedCell.css({minWidth: newWidth, maxWidth: newWidth});
                }
                function assignWatchIsEngaged() {
                    clonedCell.data(ISWATCHING, true);
                }
            }

            function addWatchForHeaderHeight() {
                $scope.$watch(getOriginalHeaderHeight, setHeightToHideOriginalHeader);
            }
            function getOriginalHeaderHeight() {
                return header.original.prop("clientHeight");
            }
            function setHeightToHideOriginalHeader(height) {
                table.original.css("marginTop", "-" + height + "px");
            }

            function getElementToAttachScroll() {
                if (isHtml(scrollContainer)) {
                    return angular.element($window);
                } else {
                    return scrollContainer;
                }
            }
            function isHtml(node) {
                return (node[0].tagName === "HTML");
            }

            function getScrollContainer(node) {
                return traverseParentsForScrollable(node);
            }
            function traverseParentsForScrollable(node) {
                var parent = node.parent();
                if (isScrollable(parent)) {
                    return parent;
                } else {
                    return traverseParentsForScrollable(parent);
                }
            }
            function isScrollable(node) {
                if (isHtml(node)) {
                    return true;
                } else if (isNonHtmlScrollable(node)) {
                    return true;
                }
                return false;
            }
            function isNonHtmlScrollable(node) {
                var overflowY = node.css("overflow-y");
                return (overflowY === "scroll" || overflowY === "auto");
            }

            function updatePositionOnScroll() {
                getElementToAttachScroll().on("scroll", function () {
                    updateHeaderPosition();
                });
            }
            function updateHeaderPosition() {
                var top = getTopValue();
                table.clone.css("top", top + "px");
            }
            function getTopValue() {
                if (isViewAboveHeader()) {
                    return 0;
                } else {
                    return getValueScrolled();
                }
            }
            function isViewAboveHeader() {
                return (getValueScrolled() <= 0);
            }
            function getValueScrolled() {
                return (getScrollerTop() - getTableTop());
            }
            function getScrollerTop() {
                return (scrollContainer[0].offsetTop + scrollContainer[0].scrollTop);
            }
            function getTableTop() {
                return table.original[0].offsetTop;
            }
        };
    }

    return {
        compile: compile
    };
}

fixHead.$inject = ['$compile', '$window'];

})(window, angular);
