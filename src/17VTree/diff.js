function newSplice(index, removed, addedCount) {
    return {
        index: index,
        removed: removed,
        addedCount: addedCount
    }
}
var EDIT_LEAVE = 0
var EDIT_UPDATE = 1
var EDIT_ADD = 2
var EDIT_DELETE = 3
function ArraySplice() {
}
ArraySplice.prototype = {
    calcEditDistances: function (current, currentStart, currentEnd, old, oldStart, oldEnd) {
        var rowCount = oldEnd - oldStart + 1
        var columnCount = currentEnd - currentStart + 1
        var distances = new Array(rowCount)
        for (var i = 0; i < rowCount; i++) {
            distances[i] = new Array(columnCount)
            distances[i][0] = i
        }
        for (var j = 0; j < columnCount; j++)
            distances[0][j] = j
        for ( i = 1; i < rowCount; i++) {
            for (j = 1; j < columnCount; j++) {
                if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1]))
                    distances[i][j] = distances[i - 1][j - 1]
                else {
                    var north = distances[i - 1][j] + 1
                    var west = distances[i][j - 1] + 1
                    distances[i][j] = north < west ? north : west
                }
            }
        }
        return distances
    },
    spliceOperationsFromEditDistances: function (distances) {
        var i = distances.length - 1
        var j = distances[0].length - 1
        var current = distances[i][j]
        var edits = [];
        while (i > 0 || j > 0) {
            if (i === 0) {
                edits.push(EDIT_ADD)
                j--
                continue;
            }
            if (j === 0) {
                edits.push(EDIT_DELETE);
                i--
                continue
            }
            var northWest = distances[i - 1][j - 1];
            var west = distances[i - 1][j];
            var north = distances[i][j - 1];
            var min;
            if (west < north)
                min = west < northWest ? west : northWest;
            else
                min = north < northWest ? north : northWest;
            if (min === northWest) {
                if (northWest === current) {
                    edits.push(EDIT_LEAVE);
                } else {
                    edits.push(EDIT_UPDATE);
                    current = northWest;
                }
                i--;
                j--;
            } else if (min === west) {
                edits.push(EDIT_DELETE);
                i--;
                current = west;
            } else {
                edits.push(EDIT_ADD);
                j--;
                current = north;
            }
        }
        edits.reverse();
        return edits;
    },
    calcSplices: function (current, currentStart, currentEnd, old, oldStart, oldEnd) {
        var prefixCount = 0;
        var suffixCount = 0;
        var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
        if (currentStart === 0 && oldStart === 0)
            prefixCount = this.sharedPrefix(current, old, minLength);
        if (currentEnd === current.length && oldEnd === old.length)
            suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);
        currentStart += prefixCount;
        oldStart += prefixCount;
        currentEnd -= suffixCount;
        oldEnd -= suffixCount;
        if (currentEnd - currentStart === 0 && oldEnd - oldStart === 0)
            return [];
        if (currentStart === currentEnd) {
            var splice = newSplice(currentStart, [], 0);
            while (oldStart < oldEnd)
                splice.removed.push(old[oldStart++]);
            return [splice];
        } else if (oldStart === oldEnd)
            return [newSplice(currentStart, [], currentEnd - currentStart)];
        var ops = this.spliceOperationsFromEditDistances(this.calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));
        splice = undefined;
        var splices = [];
        var index = currentStart;
        var oldIndex = oldStart;
        for (var i = 0; i < ops.length; i++) {
            switch (ops[i]) {
                case EDIT_LEAVE:
                    if (splice) {
                        splices.push(splice);
                        splice = undefined;
                    }
                    index++;
                    oldIndex++;
                    break;

                case EDIT_UPDATE:
                    if (!splice)
                        splice = newSplice(index, [], 0);
                    splice.addedCount++;
                    index++;
                    splice.removed.push(old[oldIndex]);
                    oldIndex++;
                    break;

                case EDIT_ADD:
                    if (!splice)
                        splice = newSplice(index, [], 0);
                    splice.addedCount++;
                    index++;
                    break;

                case EDIT_DELETE:
                    if (!splice)
                        splice = newSplice(index, [], 0);
                    splice.removed.push(old[oldIndex]);
                    oldIndex++;
                    break;
            }
        }
        if (splice) {
            splices.push(splice);
        }
        return splices;
    },
    sharedPrefix: function (current, old, searchLength) {
        for (var i = 0; i < searchLength; i++)
            if (!this.equals(current[i], old[i]))
                return i;
        return searchLength;
    },
    sharedSuffix: function (current, old, searchLength) {
        var index1 = current.length;
        var index2 = old.length;
        var count = 0;
        while (count < searchLength && this.equals(current[--index1], old[--index2]))
            count++;
        return count;
    },
    calculateSplices: function (current, previous) {
        return this.calcSplices(current, 0, current.length, previous, 0, previous.length);
    },
    equals: function (currentValue, previousValue) {
        return currentValue === previousValue;
    }
};