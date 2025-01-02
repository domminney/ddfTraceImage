var fs = require('fs')
var jimp = require('jimp')

var inFile = 'in.png'
var guideFile = 'guide.png'
var useGuide = false
var randomiseStart = true
var deleteOutputsOnStart = true

var img, w, h, startx, starty, inc, grid, newimg, startPixelList

var savestep = 200

var threads = 0


if (deleteOutputsOnStart) {

    var files = fs.readdirSync('outputs')

    for (var i = 0; i < files.length; i++) {

        fs.unlinkSync('outputs/' + files[i])

    }

}

async function main() {

    img = await jimp.Jimp.read(inFile)
    w = img.bitmap.width
    h = img.bitmap.height

    newimg = new jimp.Jimp({ width: w, height: h, format: jimp.AUTO, color: 0xffffffff })

    startx = 0
    starty = 0
    inc = 0
    grid = {}
    startPixelList = []

    for (var y = h - 1; y > -1; y--) {
        for (var x = w - 1; x > -1; x--) {


            grid[x + ',' + y] = {
                visited: false,
                x: x,
                y: y,
                black: jimp.intToRGBA(img.getPixelColor(x, y)).r < 254 ? true : false,
                nofollow: false
            }

            if (grid[x + ',' + y].black) startPixelList.push(x + ',' + y)


        }
    }

    if (randomiseStart) startPixelList = startPixelList.sort(() => Math.random() - 0.5)

    if (useGuide) {

        var guide = await jimp.Jimp.read(guideFile)
        startPixelList = []
        pixelListToOrder = []

        for (var y = h - 1; y > -1; y--) {
            for (var x = w - 1; x > -1; x--) {

                var c = jimp.intToRGBA(guide.getPixelColor(x, y))

                if (Math.abs(c.g - c.b) > 4) {
                    pixelListToOrder.push({
                        x, y, r: c.r, g: c.g, b: c.b
                    })
                }
            }
        }

        pixelListToOrder.sort((a, b) => b.g - a.g)
        pixelListToOrder.reverse()


        for (var x = 0; x < pixelListToOrder.length; x++) {
            startPixelList.push(pixelListToOrder[x].x + ',' + pixelListToOrder[x].y)
        }

        console.log(pixelListToOrder[0], pixelListToOrder[1200])
        console.log(startPixelList)

    }



    for (var c = 0; c < 1; c++) {
        setTimeout(nextTrace, c * 1, c)
    }



}


async function nextTrace(shift) {

    threads++

    while (true) {


        var found = false

        while (startPixelList.length > 0) {

            var xy = startPixelList.pop()

            if (grid[xy].black && !grid[xy].visited) {

                startx = grid[xy].x
                starty = grid[xy].y
                found = true
                break
            }

        }


        if (!found) {
            break
        }

        console.log('start', startx, starty)

        await trace(startx, starty, shift)

    }

    threads--

    if (threads == 0) {

        var fn = 'outputs/' + Math.ceil(inc / savestep).toString().padStart(8, '0') + '-lines.png'

        await newimg.write(fn)

        console.log('done')
    }


}

var allNeighbours = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]]

async function trace(startx, starty, shift) {


    if (!grid[startx + ',' + starty]) {
        return
    }

    if (grid[startx + ',' + starty].visited) {
        return
    }

    grid[startx + ',' + starty].visited = true

    if (grid[startx + ',' + starty].black) {

        shift++
        newimg.setPixelColor(img.getPixelColor(startx, starty), startx, starty)


        if (inc % savestep === 0) {

            var fn = 'outputs/' + (inc / savestep).toString().padStart(8, '0') + '-lines.png'

            var ni2 = newimg.clone()

            await ni2.write(fn)

        }

        inc++

        var neighbours = [...allNeighbours]

        shift = shift % 8

        for (var i = 0; i < shift; i++) {

            neighbours.push(neighbours.shift())

        }


        //neighbours = neighbours.sort(() => Math.random() - 0.5)


        for (var i = 0; i < neighbours.length; i++) {
            var dx = neighbours[i][0]
            var dy = neighbours[i][1]

            if (startx + dx >= 0 && startx + dx < w && starty + dy >= 0 && starty + dy < h) {
                if (!grid[(startx + dx) + ',' + (starty + dy)].visited) {
                    await trace(startx + dx, starty + dy, shift)
                }
            }
        }

    }

    return



}


main()
