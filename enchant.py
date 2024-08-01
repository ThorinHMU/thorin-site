from PIL import Image
import io


def enchant(img):
    # Chargement de l'image de l'épée
    epee = Image.open(f'../API Ptérodactyl/items_1.20.1/{img}.png')

    # Chargement de l'image du fond
    fond = Image.open('../API Ptérodactyl/fond.png')

    # Assurez-vous que les deux images ont les mêmes dimensions
    fond = fond.resize(epee.size)

    # Appliquer l'effet d'enchantement uniquement à la partie opaque de l'image de l'épée
    enchantement = Image.new('RGBA', epee.size, (0, 0, 0, 0))
    for x in range(epee.width):
        for y in range(epee.height):
            pixel_epee = epee.getpixel((x, y))
            pixel_fond = fond.getpixel((x, y))
            if pixel_epee[0] > 0:  # Vérifier l'opacité du pixel de l'épée
                enchantement.putpixel((x, y), pixel_fond)

    # Superposer l'image d'épée et l'image d'enchantement
    epee_enchantee = Image.alpha_composite(epee.convert('RGBA'), enchantement)

    img_io = io.BytesIO()

    epee_enchantee.save(img_io, "PNG")
    img_io.seek(0)
    return img_io
