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
            }, parentContainer = table.original.parent(),
                scrollContainer = getScrollContainer(table.original);

            table.clone.css({display: 'block', overflow: 'hidden', position: 'relative'}).addClass('clone');
            header.clone.css('display', 'block');
            header.original.css('visibility', 'hidden');

            insertIntoDom();
            compileClonedTable();

            getElementToAttachScroll().on('scroll', function () {
                // use CSS transforms to move the cloned header when the table is scrolled horizontally
                header.clone.css('transform', 'translate3d(' + -(scrollContainer.prop('scrollLeft')) + 'px, 0, 0)');
                updateHeaderPosition();
            });

            $scope.$watch(cells, updateCells);

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
            function isHtml(node) {
                return (node[0].tagName === "HTML");
            }
            function isNonHtmlScrollable(node) {
                var overflowY = node.css("overflow-y");
                return (overflowY === "scroll" || overflowY === "auto");
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

            function getElementToAttachScroll() {
                if (isHtml(scrollContainer)) {
                    return angular.element($window);
                } else {
                    return scrollContainer;
                }
            }

            function cells() {
                return header.clone.find('th').length;
            }

            function getCells(node) {
                return Array.prototype.map.call(node.find('th'), function (cell) {
                    return jQLite(cell);
                });
            }

            function height() {
                return header.original.prop('clientHeight');
            }

            function jQLite(node) {
                return angular.element(node);
            }

            function marginTop(height) {
                table.original.css('marginTop', '-' + height + 'px');
            }

            function updateCells() {
                var cells = {
                    clone: getCells(header.clone),
                    original: getCells(header.original)
                };

                cells.clone.forEach(function (clone, index) {
                    if (clone.data('isClone')) {
                        return;
                    }

                    // prevent duplicating watch listeners
                    clone.data('isClone', true);

                    var cell = cells.original[index];
                    var style = $window.getComputedStyle(cell[0]);

                    var getWidth = function () {
                        return style.width;
                    };

                    var setWidth = function () {
                        marginTop(height());
                        clone.css({minWidth: style.width, maxWidth: style.width});
                    };

                    var listener = $scope.$watch(getWidth, setWidth);

                    $window.addEventListener('resize', setWidth);

                    clone.on('$destroy', function () {
                        listener();
                        $window.removeEventListener('resize', setWidth);
                    });

                    cell.on('$destroy', function () {
                        clone.remove();
                    });
                });
            }
        };
    }

    return {
        compile: compile
    };
}

fixHead.$inject = ['$compile', '$window'];

})(window, angular);
